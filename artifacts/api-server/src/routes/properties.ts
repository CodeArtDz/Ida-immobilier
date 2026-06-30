import { Router, type Request, type Response, type NextFunction } from "express";
import { db } from "@workspace/db";
import {
  propertiesTable,
  propertyMediaTable,
  propertyAssignmentsTable,
  usersTable,
  agenciesTable,
  favoritesTable,
  activityLogsTable,
} from "@workspace/db";
import { eq, and, or, desc, sql, ilike, gte, lte, count, inArray } from "drizzle-orm";
import { requireAuth, optionalAuth, requireRole } from "../lib/auth";
import { logger } from "../lib/logger";
import { pingIndexNow } from "../lib/indexnow";
import { notifySavedSearchMatches, notifyPriceStatusChanges } from "../lib/property-matching";
import { buildPropertySlug } from "@workspace/seo";
import multer from "multer";
import { applyWatermarkBuffer } from "../lib/watermark";
import { generateImageVariants } from "../lib/image-variants";
import { getStorageService } from "../lib/storage";
import { geocodeAddress, hasValidCoords } from "../lib/geocode";
import { PDFParse } from "pdf-parse";
import { parseFiche } from "../lib/fiche-parser";

const objectStorageService = getStorageService();

// Media is buffered in memory (not written to disk) so it can be watermarked and
// pushed to object storage — the production filesystem is ephemeral and loses
// any disk-written uploads on restart/scale.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Type de fichier non autorisé"));
  },
});

// PostgreSQL text columns reject NUL bytes; strip them (and they can arrive via
// pasted text or PDF-extracted content) from all string values before insert.
function stripNullBytes<T>(value: T): T {
  if (typeof value === "string") {
    return value.replace(/\u0000/g, "") as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => stripNullBytes(v)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = stripNullBytes(v);
    }
    return out as T;
  }
  return value;
}

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    file.mimetype === "application/pdf"
      ? cb(null, true)
      : cb(new Error("Seuls les fichiers PDF sont acceptés"));
  },
});

// Runs the PDF multer middleware and maps upload errors to JSON responses.
// Without this, multer errors bubble to Express's default handler and surface
// as non-JSON 500s the frontend can't display.
const pdfUploadSingle = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  pdfUpload.single("file")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Le fichier PDF dépasse la taille maximale de 20 Mo."
          : "Fichier invalide.";
      res.status(status).json({ error: message });
      return;
    }
    if (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : "Fichier invalide.",
      });
      return;
    }
    next();
  });
};

const router = Router();

/**
 * Resolves the effective responsible agent for a set of properties.
 * Honors temporary assignments: while an assignment is active and today is within
 * its date range, the temporary agent is responsible. Once the end date has passed,
 * the assignment is lazily expired (marked inactive) and the property reverts to its owner.
 * Returns a Map of propertyId -> effective agent userId.
 */
async function resolveEffectiveAgents(
  props: { id: number; ownerAgentId: number; currentAgentId: number | null }[],
): Promise<Map<number, number>> {
  const result = new Map<number, number>();
  if (props.length === 0) return result;

  const ids = props.map((p) => p.id);
  const activeAssignments = await db
    .select()
    .from(propertyAssignmentsTable)
    .where(and(inArray(propertyAssignmentsTable.propertyId, ids), eq(propertyAssignmentsTable.isActive, true)));

  const today = new Date().toISOString().slice(0, 10);
  const byProp = new Map<number, (typeof activeAssignments)[number]>();
  for (const a of activeAssignments) byProp.set(a.propertyId, a);

  const expiredAssignmentIds: number[] = [];
  const expiredPropIds: number[] = [];

  for (const p of props) {
    const a = byProp.get(p.id);
    if (a) {
      if (today < a.startDate) {
        // Assignment hasn't started yet — owner is still responsible.
        result.set(p.id, p.ownerAgentId);
      } else if (today <= a.endDate) {
        // Assignment is active within its window.
        result.set(p.id, a.temporaryAgentId);
      } else {
        // Assignment has ended — lazily expire and revert to owner.
        expiredAssignmentIds.push(a.id);
        expiredPropIds.push(p.id);
        result.set(p.id, p.ownerAgentId);
      }
    } else {
      result.set(p.id, p.currentAgentId ?? p.ownerAgentId);
    }
  }

  if (expiredAssignmentIds.length > 0) {
    await db
      .update(propertyAssignmentsTable)
      .set({ isActive: false })
      .where(inArray(propertyAssignmentsTable.id, expiredAssignmentIds));
    await db
      .update(propertiesTable)
      .set({ currentAgentId: sql`${propertiesTable.ownerAgentId}` })
      .where(inArray(propertiesTable.id, expiredPropIds));
  }

  return result;
}

// Agents may only read/mutate properties they own or are currently responsible
// for. Staff with broader roles (agency_manager and above) are not scoped here.
function agentMayAccessProperty(
  user: { id: number; role: string } | undefined | null,
  property: { ownerAgentId: number; currentAgentId: number | null },
): boolean {
  if (!user || user.role !== "agent") return true;
  return property.ownerAgentId === user.id || property.currentAgentId === user.id;
}

// Loads a property by id and enforces agent ownership scope. On failure it writes
// the appropriate response (404 missing / 403 forbidden) and returns null.
async function loadPropertyForUser(
  req: Request,
  res: Response,
  id: number,
): Promise<typeof propertiesTable.$inferSelect | null> {
  const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, id));
  if (!property) { res.status(404).json({ error: "Bien non trouvé" }); return null; }
  const user = (req as any).user;
  if (!agentMayAccessProperty(user, property)) {
    res.status(403).json({ error: "Accès refusé" }); return null;
  }
  return property;
}

// GET /properties
router.get("/properties", optionalAuth, async (req, res) => {
  try {
    const {
      status, type, city, minPrice, maxPrice, minArea, maxArea,
      rooms, bedrooms, agencyId, agentId, page = "1", limit = "12", search,
      dpeRating, hasTerrace, hasPool, hasGarden, hasParking, hasBalcony, hasGarage, minBathrooms
    } = req.query as Record<string, string>;

    const user = (req as any).user;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Build base query
    const conditions = [];

    // Public only sees published unless agent/admin
    if (!user || user.role === "client") {
      conditions.push(eq(propertiesTable.status, "published"));
    } else if (status) {
      conditions.push(eq(propertiesTable.status, status as any));
    }

    // Agents only see properties they own (added) or are currently responsible for.
    // Admins, superadmins and agency managers see all properties.
    if (user && user.role === "agent") {
      conditions.push(
        or(
          eq(propertiesTable.ownerAgentId, user.id),
          eq(propertiesTable.currentAgentId, user.id),
        )!,
      );
    }

    if (type) conditions.push(eq(propertiesTable.type, type as any));
    if (city) conditions.push(ilike(propertiesTable.city, `%${city}%`));
    if (agencyId) conditions.push(eq(propertiesTable.agencyId, parseInt(agencyId)));
    if (agentId) conditions.push(eq(propertiesTable.currentAgentId, parseInt(agentId)));
    if (rooms) conditions.push(gte(propertiesTable.rooms, parseInt(rooms)));
    if (bedrooms) conditions.push(gte(propertiesTable.bedrooms, parseInt(bedrooms)));
    if (minArea) conditions.push(gte(propertiesTable.livingArea, parseFloat(minArea)));
    if (maxArea) conditions.push(lte(propertiesTable.livingArea, parseFloat(maxArea)));
    if (minPrice) conditions.push(gte(propertiesTable.salePrice, minPrice));
    if (maxPrice) conditions.push(lte(propertiesTable.salePrice, maxPrice));
    if (search) conditions.push(ilike(propertiesTable.title, `%${search}%`));
    if (dpeRating) conditions.push(eq(propertiesTable.dpeRating, dpeRating));
    if (hasTerrace === "true") conditions.push(eq(propertiesTable.hasTerrace, true));
    if (hasPool === "true") conditions.push(eq(propertiesTable.hasPool, true));
    if (hasGarden === "true") conditions.push(eq(propertiesTable.hasGarden, true));
    if (hasParking === "true") conditions.push(eq(propertiesTable.hasParking, true));
    if (hasBalcony === "true") conditions.push(eq(propertiesTable.hasBalcony, true));
    if (hasGarage === "true") conditions.push(eq(propertiesTable.hasGarage, true));
    if (minBathrooms) conditions.push(gte(propertiesTable.bathrooms, parseInt(minBathrooms)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult, properties] = await Promise.all([
      db.select({ count: count() }).from(propertiesTable).where(whereClause),
      db.select().from(propertiesTable)
        .where(whereClause)
        .orderBy(desc(propertiesTable.createdAt))
        .limit(limitNum)
        .offset(offset),
    ]);

    const total = totalResult[0]?.count ?? 0;

    // Resolve effective responsible agent per property (honors temporary assignments)
    const effectiveAgents = await resolveEffectiveAgents(properties);

    // Enrich with agent/agency info and main image
    const enriched = await Promise.all(properties.map(async (p) => {
      const effAgentId = effectiveAgents.get(p.id) ?? p.ownerAgentId;
      const [agent, agency, [mainMedia]] = await Promise.all([
        db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName, phone: usersTable.phone, email: usersTable.email, avatarUrl: usersTable.avatarUrl })
            .from(usersTable).where(eq(usersTable.id, effAgentId)).then(r => r[0]),
        db.select({ name: agenciesTable.name }).from(agenciesTable).where(eq(agenciesTable.id, p.agencyId)).then(r => r[0]),
        db.select({ url: propertyMediaTable.url }).from(propertyMediaTable)
          .where(and(eq(propertyMediaTable.propertyId, p.id), eq(propertyMediaTable.type, "photo")))
          .orderBy(propertyMediaTable.order).limit(1),
        db.select({ cnt: count() }).from(propertyMediaTable).where(eq(propertyMediaTable.propertyId, p.id)),
      ]);
      return {
        ...p,
        currentAgentId: effAgentId,
        salePrice: p.salePrice ? parseFloat(p.salePrice) : null,
        rentalPrice: p.rentalPrice ? parseFloat(p.rentalPrice) : null,
        charges: p.charges ? parseFloat(p.charges) : null,
        agencyFees: p.agencyFees ? parseFloat(p.agencyFees) : null,
        taxeFonciere: p.taxeFonciere ? parseFloat(p.taxeFonciere) : null,
        annualEnergyCost: p.annualEnergyCost ? parseFloat(p.annualEnergyCost) : null,
        agentName: agent ? `${agent.firstName} ${agent.lastName}` : null,
        agentPhone: agent?.phone ?? null,
        agentEmail: agent?.email ?? null,
        agentAvatarUrl: agent?.avatarUrl ?? null,
        agencyName: agency?.name ?? null,
        mainImageUrl: mainMedia?.url ?? null,
        mediaCount: 0,
      };
    }));

    res.json({ data: enriched, total, page: pageNum, limit: limitNum });
  } catch (err) {
    logger.error({ err }, "List properties error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /properties/featured
router.get("/properties/featured", async (_req, res) => {
  try {
    const properties = await db.select().from(propertiesTable)
      .where(eq(propertiesTable.status, "published"))
      .orderBy(desc(propertiesTable.viewCount))
      .limit(6);

    const enriched = await Promise.all(properties.map(async (p) => {
      const [agent, agency, [mainMedia]] = await Promise.all([
        db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName, phone: usersTable.phone, email: usersTable.email, avatarUrl: usersTable.avatarUrl })
          .from(usersTable).where(eq(usersTable.id, p.ownerAgentId)).then(r => r[0]),
        db.select({ name: agenciesTable.name }).from(agenciesTable).where(eq(agenciesTable.id, p.agencyId)).then(r => r[0]),
        db.select({ url: propertyMediaTable.url }).from(propertyMediaTable)
          .where(and(eq(propertyMediaTable.propertyId, p.id), eq(propertyMediaTable.type, "photo")))
          .orderBy(propertyMediaTable.order).limit(1),
      ]);
      return {
        ...p,
        salePrice: p.salePrice ? parseFloat(p.salePrice) : null,
        rentalPrice: p.rentalPrice ? parseFloat(p.rentalPrice) : null,
        charges: p.charges ? parseFloat(p.charges) : null,
        agencyFees: p.agencyFees ? parseFloat(p.agencyFees) : null,
        taxeFonciere: p.taxeFonciere ? parseFloat(p.taxeFonciere) : null,
        annualEnergyCost: p.annualEnergyCost ? parseFloat(p.annualEnergyCost) : null,
        agentName: agent ? `${agent.firstName} ${agent.lastName}` : null,
        agentPhone: agent?.phone ?? null,
        agentEmail: agent?.email ?? null,
        agentAvatarUrl: agent?.avatarUrl ?? null,
        agencyName: agency?.name ?? null,
        mainImageUrl: mainMedia?.url ?? null,
        mediaCount: 0,
      };
    }));

    res.json(enriched);
  } catch (err) {
    logger.error({ err }, "Featured properties error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /properties/stats
router.get("/properties/stats", requireAuth, async (_req, res) => {
  try {
    const [byStatus, byType, byCity, [totalRow]] = await Promise.all([
      db.select({ label: propertiesTable.status, count: count() })
        .from(propertiesTable).groupBy(propertiesTable.status),
      db.select({ label: propertiesTable.type, count: count() })
        .from(propertiesTable).groupBy(propertiesTable.type),
      db.select({ label: propertiesTable.city, count: count() })
        .from(propertiesTable).groupBy(propertiesTable.city).orderBy(desc(count())).limit(10),
      db.select({ count: count() }).from(propertiesTable),
    ]);

    res.json({
      total: totalRow?.count ?? 0,
      byStatus: byStatus.map(r => ({ label: r.label, count: r.count, value: null })),
      byType: byType.map(r => ({ label: r.label, count: r.count, value: null })),
      byCity: byCity.map(r => ({ label: r.label, count: r.count, value: null })),
    });
  } catch (err) {
    logger.error({ err }, "Property stats error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /properties/area-stats — aggregated market stats for an SEO area page.
// Published listings only; small result sets so aggregation is done in JS.
router.get("/properties/area-stats", async (req, res) => {
  try {
    const { city, postalCode, type, transaction } = req.query as Record<string, string>;
    const conditions = [eq(propertiesTable.status, "published")];
    if (city) conditions.push(ilike(propertiesTable.city, `%${city}%`));
    if (postalCode) conditions.push(eq(propertiesTable.postalCode, postalCode));
    if (type) conditions.push(eq(propertiesTable.type, type as any));

    const rows = await db
      .select({
        type: propertiesTable.type,
        salePrice: propertiesTable.salePrice,
        rentalPrice: propertiesTable.rentalPrice,
        livingArea: propertiesTable.livingArea,
      })
      .from(propertiesTable)
      .where(and(...conditions));

    const filtered =
      transaction === "rent"
        ? rows.filter((r) => r.rentalPrice != null)
        : transaction === "sale"
          ? rows.filter((r) => r.salePrice != null)
          : rows;

    const sales = filtered.map((r) => (r.salePrice ? parseFloat(r.salePrice) : null)).filter((n): n is number => n != null);
    const rentals = filtered.map((r) => (r.rentalPrice ? parseFloat(r.rentalPrice) : null)).filter((n): n is number => n != null);
    const pricePerM2 = filtered
      .map((r) => {
        const price = r.salePrice ? parseFloat(r.salePrice) : null;
        return price && r.livingArea ? price / r.livingArea : null;
      })
      .filter((n): n is number => n != null);

    const avg = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);

    const byTypeMap = new Map<string, { count: number; total: number }>();
    for (const r of filtered) {
      const entry = byTypeMap.get(r.type) ?? { count: 0, total: 0 };
      entry.count += 1;
      if (r.salePrice) entry.total += parseFloat(r.salePrice);
      byTypeMap.set(r.type, entry);
    }

    res.json({
      count: filtered.length,
      saleCount: sales.length,
      rentalCount: rentals.length,
      avgSalePrice: avg(sales),
      avgRentalPrice: avg(rentals),
      avgPricePerM2: avg(pricePerM2),
      minSalePrice: sales.length ? Math.min(...sales) : null,
      maxSalePrice: sales.length ? Math.max(...sales) : null,
      byType: [...byTypeMap.entries()].map(([label, v]) => ({
        label,
        count: v.count,
        value: v.count ? Math.round(v.total / v.count) : null,
      })),
    });
  } catch (err) {
    logger.error({ err }, "Area stats error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /properties/slug/:slug — public lookup by SEO slug.
router.get("/properties/slug/:slug", optionalAuth, async (req, res) => {
  try {
    const slug = req.params.slug as string;
    const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.slug, slug));
    if (!property) { res.status(404).json({ error: "Bien non trouvé" }); return; }

    const user = (req as any).user;
    if (property.status !== "published" && (!user || user.role === "client")) {
      res.status(404).json({ error: "Bien non trouvé" }); return;
    }
    // Agents may not preview another agent's unpublished property by slug.
    if (property.status !== "published" && !agentMayAccessProperty(user, property)) {
      res.status(404).json({ error: "Bien non trouvé" }); return;
    }

    await db.update(propertiesTable).set({ viewCount: property.viewCount + 1 }).where(eq(propertiesTable.id, property.id));

    const effective = await resolveEffectiveAgents([property]);
    const agentId = effective.get(property.id) ?? property.ownerAgentId;
    const [agent, agency, [mainMedia]] = await Promise.all([
      db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName, phone: usersTable.phone, email: usersTable.email, avatarUrl: usersTable.avatarUrl })
        .from(usersTable).where(eq(usersTable.id, agentId)).then(r => r[0]),
      db.select({ name: agenciesTable.name }).from(agenciesTable).where(eq(agenciesTable.id, property.agencyId)).then(r => r[0]),
      db.select({ url: propertyMediaTable.url }).from(propertyMediaTable)
        .where(and(eq(propertyMediaTable.propertyId, property.id), eq(propertyMediaTable.type, "photo")))
        .orderBy(propertyMediaTable.order).limit(1),
    ]);

    res.json({
      ...property,
      currentAgentId: agentId,
      salePrice: property.salePrice ? parseFloat(property.salePrice) : null,
      rentalPrice: property.rentalPrice ? parseFloat(property.rentalPrice) : null,
      charges: property.charges ? parseFloat(property.charges) : null,
      agencyFees: property.agencyFees ? parseFloat(property.agencyFees) : null,
      taxeFonciere: property.taxeFonciere ? parseFloat(property.taxeFonciere) : null,
      annualEnergyCost: property.annualEnergyCost ? parseFloat(property.annualEnergyCost) : null,
      agentName: agent ? `${agent.firstName} ${agent.lastName}` : null,
      agentPhone: agent?.phone ?? null,
      agentEmail: agent?.email ?? null,
      agentAvatarUrl: agent?.avatarUrl ?? null,
      agencyName: agency?.name ?? null,
      mainImageUrl: mainMedia?.url ?? null,
      mediaCount: 0,
    });
  } catch (err) {
    logger.error({ err }, "Get property by slug error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /properties/:id
router.get("/properties/:id", optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, id));
    if (!property) { res.status(404).json({ error: "Bien non trouvé" }); return; }

    const user = (req as any).user;
    if (property.status !== "published" && (!user || user.role === "client")) {
      res.status(404).json({ error: "Bien non trouvé" }); return;
    }
    // Agents may only access their own / currently-assigned properties.
    if (!agentMayAccessProperty(user, property)) {
      res.status(404).json({ error: "Bien non trouvé" }); return;
    }

    // Increment view count
    await db.update(propertiesTable).set({ viewCount: property.viewCount + 1 }).where(eq(propertiesTable.id, id));

    const effective = await resolveEffectiveAgents([property]);
    const agentId = effective.get(property.id) ?? property.ownerAgentId;
    const [agent, agency, [mainMedia]] = await Promise.all([
      db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName, phone: usersTable.phone, email: usersTable.email, avatarUrl: usersTable.avatarUrl })
        .from(usersTable).where(eq(usersTable.id, agentId)).then(r => r[0]),
      db.select({ name: agenciesTable.name }).from(agenciesTable).where(eq(agenciesTable.id, property.agencyId)).then(r => r[0]),
      db.select({ url: propertyMediaTable.url }).from(propertyMediaTable)
        .where(and(eq(propertyMediaTable.propertyId, id), eq(propertyMediaTable.type, "photo")))
        .orderBy(propertyMediaTable.order).limit(1),
    ]);

    res.json({
      ...property,
      currentAgentId: agentId,
      salePrice: property.salePrice ? parseFloat(property.salePrice) : null,
      rentalPrice: property.rentalPrice ? parseFloat(property.rentalPrice) : null,
      charges: property.charges ? parseFloat(property.charges) : null,
      agencyFees: property.agencyFees ? parseFloat(property.agencyFees) : null,
      taxeFonciere: property.taxeFonciere ? parseFloat(property.taxeFonciere) : null,
      annualEnergyCost: property.annualEnergyCost ? parseFloat(property.annualEnergyCost) : null,
      agentName: agent ? `${agent.firstName} ${agent.lastName}` : null,
      agentPhone: agent?.phone ?? null,
      agentEmail: agent?.email ?? null,
      agentAvatarUrl: agent?.avatarUrl ?? null,
      agencyName: agency?.name ?? null,
      mainImageUrl: mainMedia?.url ?? null,
      mediaCount: 0,
    });
  } catch (err) {
    logger.error({ err }, "Get property error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /properties
router.post("/properties", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const data = stripNullBytes(req.body);

    // Auto-geocode the address into map coordinates when none were provided.
    let { latitude, longitude } = data;
    if (!hasValidCoords(latitude, longitude)) {
      const geo = await geocodeAddress({
        address: data.address,
        postalCode: data.postalCode,
        city: data.city,
        country: data.country,
      });
      if (geo) {
        latitude = geo.latitude;
        longitude = geo.longitude;
        req.log.info({ city: data.city, postalCode: data.postalCode }, "Geocoded new property address");
      } else {
        req.log.warn({ city: data.city, postalCode: data.postalCode }, "Could not geocode new property address");
      }
    }

    const [inserted] = await db.insert(propertiesTable).values({
      ...data,
      latitude,
      longitude,
      ownerAgentId: user.id,
      currentAgentId: user.id,
      agencyId: data.agencyId || user.agencyId,
    }).returning();

    // Generate the SEO slug now that we have an id, then persist it.
    const slug = buildPropertySlug({
      id: inserted.id,
      type: inserted.type,
      city: inserted.city,
      rooms: inserted.rooms,
      livingArea: inserted.livingArea,
    });
    const [property] = await db.update(propertiesTable).set({ slug }).where(eq(propertiesTable.id, inserted.id)).returning();

    if (property.status === "published") pingIndexNow([`/annonce/${property.id}`]);

    await db.insert(activityLogsTable).values({
      type: "property_created",
      description: `Nouveau bien créé : ${property.title}`,
      entityId: property.id,
      entityType: "property",
      actorId: user.id,
    });

    res.status(201).json({ ...property, salePrice: property.salePrice ? parseFloat(property.salePrice) : null, rentalPrice: property.rentalPrice ? parseFloat(property.rentalPrice) : null, agentName: null, agentPhone: null, agentEmail: null, agentAvatarUrl: null, agencyName: null, mainImageUrl: null, mediaCount: 0 });
  } catch (err) {
    logger.error({ err }, "Create property error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /properties/import-pdf — extract field values from a "fiche privée" PDF
// to prefill the new-property form. Deterministic text parsing only (no AI).
router.post(
  "/properties/import-pdf",
  requireAuth,
  requireRole("superadmin", "admin", "agency_manager", "agent"),
  pdfUploadSingle,
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier PDF fourni" });
    }
    try {
      const parser = new PDFParse({ data: req.file.buffer });
      let text: string;
      try {
        const result = await parser.getText();
        text = result.text;
      } finally {
        await parser.destroy();
      }

      if (!text || text.trim().length < 20) {
        return res.status(422).json({
          error:
            "Le PDF ne contient pas de texte exploitable. S'il s'agit d'un document scanné (image), saisissez les informations manuellement.",
        });
      }

      const data = parseFiche(text);
      req.log.info({ fieldsFound: Object.keys(data).length }, "Fiche PDF parsed");
      return res.json({ data, fieldsFound: Object.keys(data).length });
    } catch (err) {
      req.log.error({ err }, "Failed to parse fiche PDF");
      return res.status(500).json({ error: "Impossible d'analyser le PDF" });
    }
  },
);

// PATCH /properties/:id
router.patch("/properties/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const data = stripNullBytes({ ...req.body });

    // Snapshot the full row before the update so we can detect price/status
    // transitions and fire match-alert notifications afterwards.
    const [before] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, id));
    if (!before) { res.status(404).json({ error: "Bien non trouvé" }); return; }
    if (!agentMayAccessProperty((req as any).user, before)) {
      res.status(403).json({ error: "Accès refusé" }); return;
    }

    // Re-geocode when address fields change but valid coordinates weren't sent.
    const addressChanged =
      data.address !== undefined ||
      data.postalCode !== undefined ||
      data.city !== undefined ||
      data.country !== undefined;
    if (addressChanged && !hasValidCoords(data.latitude, data.longitude)) {
      const geo = await geocodeAddress({
        address: data.address ?? before.address,
        postalCode: data.postalCode ?? before.postalCode,
        city: data.city ?? before.city,
        country: data.country ?? before.country,
      });
      if (geo) {
        data.latitude = geo.latitude;
        data.longitude = geo.longitude;
        req.log.info({ id }, "Re-geocoded property address on update");
      }
    }

    const [updated] = await db.update(propertiesTable).set({ ...data, updatedAt: new Date() }).where(eq(propertiesTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Bien non trouvé" }); return; }

    // Best-effort, non-blocking match alerts. A transition into "published"
    // (newly listed or back on the market) is matched against saved searches as
    // a "new property" alert; price drops and status changes notify both the
    // property's favoriters and the owners of saved searches that still match it.
    const becamePublished = updated.status === "published" && before.status !== "published";
    if (becamePublished) {
      const kind = before.status === "draft" ? "new_match" : "back_on_market";
      void notifySavedSearchMatches(updated, kind);
    }
    void notifyPriceStatusChanges(before, updated);

    res.json({ ...updated, salePrice: updated.salePrice ? parseFloat(updated.salePrice) : null, rentalPrice: updated.rentalPrice ? parseFloat(updated.rentalPrice) : null, agentName: null, agentPhone: null, agentEmail: null, agentAvatarUrl: null, agencyName: null, mainImageUrl: null, mediaCount: 0 });
  } catch (err) {
    logger.error({ err }, "Update property error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /properties/:id/publish
router.patch("/properties/:id/publish", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const user = (req as any).user;
    const [before] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, id));
    if (!before) { res.status(404).json({ error: "Bien non trouvé" }); return; }
    if (!agentMayAccessProperty(user, before)) {
      res.status(403).json({ error: "Accès refusé" }); return;
    }
    const [updated] = await db.update(propertiesTable).set({ status: "published", updatedAt: new Date() }).where(eq(propertiesTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Bien non trouvé" }); return; }
    pingIndexNow([`/annonce/${updated.id}`]);

    // Best-effort, non-blocking match alerts when a property enters "published".
    // notifyPriceStatusChanges self-gates (no-op when nothing meaningful changed).
    if (before.status !== "published") {
      const kind = before.status === "draft" ? "new_match" : "back_on_market";
      void notifySavedSearchMatches(updated, kind);
    }
    void notifyPriceStatusChanges(before, updated);

    await db.insert(activityLogsTable).values({
      type: "property_published",
      description: `Bien publié : ${updated.title}`,
      entityId: updated.id,
      entityType: "property",
      actorId: user.id,
    });
    res.json({ ...updated, salePrice: updated.salePrice ? parseFloat(updated.salePrice) : null, rentalPrice: updated.rentalPrice ? parseFloat(updated.rentalPrice) : null, agentName: null, agentPhone: null, agentEmail: null, agentAvatarUrl: null, agencyName: null, mainImageUrl: null, mediaCount: 0 });
  } catch (err) {
    logger.error({ err }, "Publish property error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /properties/:id
router.delete("/properties/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const property = await loadPropertyForUser(req, res, id);
    if (!property) return;
    await db.delete(propertiesTable).where(eq(propertiesTable.id, id));
    res.status(204).send();
  } catch (err) {
    logger.error({ err }, "Delete property error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /properties/:id/similar
router.get("/properties/:id/similar", async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const [prop] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, id));
    if (!prop) { res.json([]); return; }
    const similar = await db.select().from(propertiesTable)
      .where(and(eq(propertiesTable.status, "published"), eq(propertiesTable.type, prop.type)))
      .orderBy(desc(propertiesTable.createdAt)).limit(4);
    const filtered = similar.filter(p => p.id !== id);
    const enriched = await Promise.all(filtered.map(async (p) => {
      const [mainMedia] = await db.select({ url: propertyMediaTable.url }).from(propertyMediaTable)
        .where(and(eq(propertyMediaTable.propertyId, p.id), eq(propertyMediaTable.type, "photo")))
        .orderBy(propertyMediaTable.order).limit(1);
      return { ...p, salePrice: p.salePrice ? parseFloat(p.salePrice) : null, rentalPrice: p.rentalPrice ? parseFloat(p.rentalPrice) : null, charges: p.charges ? parseFloat(p.charges) : null, agencyFees: p.agencyFees ? parseFloat(p.agencyFees) : null, taxeFonciere: p.taxeFonciere ? parseFloat(p.taxeFonciere) : null, annualEnergyCost: p.annualEnergyCost ? parseFloat(p.annualEnergyCost) : null, agentName: null, agentPhone: null, agentEmail: null, agentAvatarUrl: null, agencyName: null, mainImageUrl: mainMedia?.url ?? null, mediaCount: 0 };
    }));
    res.json(enriched);
  } catch (err) {
    logger.error({ err }, "Similar properties error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /properties/:id/media
router.get("/properties/:id/media", async (req, res) => {
  try {
    const media = await db.select().from(propertyMediaTable)
      .where(eq(propertyMediaTable.propertyId, parseInt(req.params.id as string)))
      .orderBy(propertyMediaTable.order);
    res.json(media);
  } catch (err) {
    logger.error({ err }, "List media error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /properties/:id/media
router.post("/properties/:id/media", requireAuth, async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id as string);
    if (!(await loadPropertyForUser(req, res, propertyId))) return;
    const [media] = await db.insert(propertyMediaTable).values({
      ...req.body,
      propertyId,
    }).returning();
    res.status(201).json(media);
  } catch (err) {
    logger.error({ err }, "Add media error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /properties/:id/media/upload  (multipart/form-data)
router.post("/properties/:id/media/upload", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      res.status(400).json({ error: "Aucun fichier fourni" });
      return;
    }

    const propertyId = parseInt(req.params.id as string);
    if (!(await loadPropertyForUser(req, res, propertyId))) return;
    const isImage = file.mimetype.startsWith("image/");

    // Persist to object storage (durable) rather than local disk (ephemeral in
    // production). The returned `/objects/...` path is served via /api/storage.
    const objectPath = await objectStorageService.uploadBuffer(file.buffer, file.mimetype);
    const originalUrl = objectStorageService.toPublicUrl(objectPath);
    let watermarkedUrl: string | null = null;
    let webpUrl: string | null = null;
    let avifUrl: string | null = null;
    let width: number | null = null;
    let height: number | null = null;

    if (isImage) {
      // Watermark first so the responsive variants carry the watermark too.
      let variantSource = file.buffer;
      try {
        const wmBuffer = await applyWatermarkBuffer(file.buffer);
        const wmPath = await objectStorageService.uploadBuffer(wmBuffer, "image/jpeg");
        watermarkedUrl = objectStorageService.toPublicUrl(wmPath);
        variantSource = wmBuffer;
      } catch (wmErr) {
        logger.warn({ wmErr }, "Watermark failed, using original");
        watermarkedUrl = originalUrl;
      }

      // Generate WebP + AVIF variants and capture intrinsic dimensions for SEO
      // and Core Web Vitals. Failure here is non-fatal — fall back to JPEG.
      try {
        const variants = await generateImageVariants(variantSource);
        const [webpPath, avifPath] = await Promise.all([
          objectStorageService.uploadBuffer(variants.webp, "image/webp"),
          objectStorageService.uploadBuffer(variants.avif, "image/avif"),
        ]);
        webpUrl = objectStorageService.toPublicUrl(webpPath);
        avifUrl = objectStorageService.toPublicUrl(avifPath);
        width = variants.width;
        height = variants.height;
      } catch (varErr) {
        logger.warn({ varErr }, "Variant generation failed, JPEG only");
      }
    }

    const existing = await db
      .select({ order: propertyMediaTable.order })
      .from(propertyMediaTable)
      .where(eq(propertyMediaTable.propertyId, propertyId))
      .orderBy(desc(propertyMediaTable.order))
      .limit(1);
    const nextOrder = (existing[0]?.order ?? -1) + 1;

    // Build descriptive alt text from the property for image SEO / accessibility.
    let alt: string | null = null;
    if (isImage) {
      const [prop] = await db
        .select({ title: propertiesTable.title, city: propertiesTable.city })
        .from(propertiesTable)
        .where(eq(propertiesTable.id, propertyId))
        .limit(1);
      if (prop) {
        alt = `${prop.title}${prop.city ? ` à ${prop.city}` : ""} — photo ${nextOrder + 1} | I.D.A Immobilier`;
      }
    }

    const [media] = await db.insert(propertyMediaTable).values({
      propertyId,
      url: originalUrl,
      watermarkedUrl,
      webpUrl,
      avifUrl,
      alt,
      width,
      height,
      type: isImage ? "photo" : "video",
      order: nextOrder,
    }).returning();

    res.status(201).json(media);
  } catch (err) {
    logger.error({ err }, "Upload media error");
    res.status(500).json({ error: "Erreur lors de l'upload" });
  }
});

// DELETE /properties/:id/media/:mediaId
router.delete("/properties/:id/media/:mediaId", requireAuth, async (req, res) => {
  try {
    if (!(await loadPropertyForUser(req, res, parseInt(req.params.id as string)))) return;
    await db.delete(propertyMediaTable).where(eq(propertyMediaTable.id, parseInt(req.params.mediaId as string)));
    res.status(204).send();
  } catch (err) {
    logger.error({ err }, "Delete media error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /properties/:id/media/:mediaId/main — set a photo as the main image
router.post("/properties/:id/media/:mediaId/main", requireAuth, async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id as string);
    const mediaId = parseInt(req.params.mediaId as string);
    if (!(await loadPropertyForUser(req, res, propertyId))) return;

    const updated = await db.transaction(async (tx) => {
      const all = await tx
        .select()
        .from(propertyMediaTable)
        .where(eq(propertyMediaTable.propertyId, propertyId))
        .orderBy(propertyMediaTable.order);

      const target = all.find((m) => m.id === mediaId);
      if (!target) {
        return { error: "not_found" as const };
      }
      if (target.type !== "photo") {
        return { error: "not_photo" as const };
      }

      const reordered = [target, ...all.filter((m) => m.id !== mediaId)];
      for (let idx = 0; idx < reordered.length; idx++) {
        await tx
          .update(propertyMediaTable)
          .set({ order: idx })
          .where(eq(propertyMediaTable.id, reordered[idx]!.id));
      }

      return await tx
        .select()
        .from(propertyMediaTable)
        .where(eq(propertyMediaTable.propertyId, propertyId))
        .orderBy(propertyMediaTable.order);
    });

    if ("error" in updated) {
      if (updated.error === "not_found") {
        res.status(404).json({ error: "Média introuvable" });
      } else {
        res.status(400).json({ error: "Seule une photo peut être définie comme principale" });
      }
      return;
    }

    res.json(updated);
  } catch (err) {
    logger.error({ err }, "Set main media error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /properties/:id/assign — change the responsible agent (permanently or temporarily)
router.post("/properties/:id/assign", requireAuth, requireRole("superadmin", "admin", "agency_manager"), async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, id));
    if (!property) { res.status(404).json({ error: "Bien non trouvé" }); return; }

    const { temporaryAgentId, permanent, startDate, endDate, reason } = req.body;
    if (!temporaryAgentId) { res.status(400).json({ error: "Agent requis" }); return; }

    // Validate the target agent exists and is staff (not a client)
    const [targetAgent] = await db.select().from(usersTable).where(eq(usersTable.id, temporaryAgentId));
    if (!targetAgent || targetAgent.role === "client") { res.status(400).json({ error: "Agent invalide" }); return; }

    // End any existing active assignment for this property
    await db.update(propertyAssignmentsTable)
      .set({ isActive: false })
      .where(and(eq(propertyAssignmentsTable.propertyId, id), eq(propertyAssignmentsTable.isActive, true)));

    if (permanent) {
      // Permanent reassignment: the new agent becomes the owner and current agent.
      // Keep agencyId consistent with the agent's agency when known.
      await db.update(propertiesTable)
        .set({
          ownerAgentId: temporaryAgentId,
          currentAgentId: temporaryAgentId,
          agencyId: targetAgent.agencyId ?? property.agencyId,
        })
        .where(eq(propertiesTable.id, id));
    } else {
      // Temporary assignment requires a date range
      if (!startDate || !endDate) {
        res.status(400).json({ error: "Dates de début et de fin requises pour une assignation temporaire" });
        return;
      }
      if (endDate < startDate) {
        res.status(400).json({ error: "La date de fin doit être postérieure à la date de début" });
        return;
      }
      await db.insert(propertyAssignmentsTable).values({
        propertyId: id,
        ownerAgentId: property.ownerAgentId,
        temporaryAgentId,
        startDate,
        endDate,
        reason: reason || null,
        isActive: true,
      });
      // Only switch the current agent if the assignment window has already started.
      // Future-dated assignments keep the owner responsible until startDate.
      const today = new Date().toISOString().slice(0, 10);
      const currentAgentId = startDate <= today ? temporaryAgentId : property.ownerAgentId;
      await db.update(propertiesTable).set({ currentAgentId }).where(eq(propertiesTable.id, id));
    }

    // Return the updated, enriched property
    const [updated] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, id));
    const effective = await resolveEffectiveAgents([updated]);
    const effAgentId = effective.get(id) ?? updated.ownerAgentId;
    const [agent, agency, [mainMedia]] = await Promise.all([
      db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName, phone: usersTable.phone, email: usersTable.email, avatarUrl: usersTable.avatarUrl })
        .from(usersTable).where(eq(usersTable.id, effAgentId)).then(r => r[0]),
      db.select({ name: agenciesTable.name }).from(agenciesTable).where(eq(agenciesTable.id, updated.agencyId)).then(r => r[0]),
      db.select({ url: propertyMediaTable.url }).from(propertyMediaTable)
        .where(and(eq(propertyMediaTable.propertyId, id), eq(propertyMediaTable.type, "photo")))
        .orderBy(propertyMediaTable.order).limit(1),
    ]);

    res.status(201).json({
      ...updated,
      currentAgentId: effAgentId,
      salePrice: updated.salePrice ? parseFloat(updated.salePrice) : null,
      rentalPrice: updated.rentalPrice ? parseFloat(updated.rentalPrice) : null,
      charges: updated.charges ? parseFloat(updated.charges) : null,
      agencyFees: updated.agencyFees ? parseFloat(updated.agencyFees) : null,
      taxeFonciere: updated.taxeFonciere ? parseFloat(updated.taxeFonciere) : null,
      annualEnergyCost: updated.annualEnergyCost ? parseFloat(updated.annualEnergyCost) : null,
      agentName: agent ? `${agent.firstName} ${agent.lastName}` : null,
      agentPhone: agent?.phone ?? null,
      agentEmail: agent?.email ?? null,
      agentAvatarUrl: agent?.avatarUrl ?? null,
      agencyName: agency?.name ?? null,
      mainImageUrl: mainMedia?.url ?? null,
    });
  } catch (err) {
    logger.error({ err }, "Assign property error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
