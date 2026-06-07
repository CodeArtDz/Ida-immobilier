import { Router } from "express";
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
import { eq, and, desc, sql, ilike, gte, lte, count } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router = Router();

// GET /properties
router.get("/properties", optionalAuth, async (req, res) => {
  try {
    const {
      status, type, city, minPrice, maxPrice, minArea, maxArea,
      rooms, bedrooms, agencyId, agentId, page = "1", limit = "12", search
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

    // Enrich with agent/agency info and main image
    const enriched = await Promise.all(properties.map(async (p) => {
      const [agent, agency, [mainMedia]] = await Promise.all([
        p.currentAgentId
          ? db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName, phone: usersTable.phone, email: usersTable.email, avatarUrl: usersTable.avatarUrl })
              .from(usersTable).where(eq(usersTable.id, p.currentAgentId)).then(r => r[0])
          : db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName, phone: usersTable.phone, email: usersTable.email, avatarUrl: usersTable.avatarUrl })
              .from(usersTable).where(eq(usersTable.id, p.ownerAgentId)).then(r => r[0]),
        db.select({ name: agenciesTable.name }).from(agenciesTable).where(eq(agenciesTable.id, p.agencyId)).then(r => r[0]),
        db.select({ url: propertyMediaTable.url }).from(propertyMediaTable)
          .where(and(eq(propertyMediaTable.propertyId, p.id), eq(propertyMediaTable.type, "photo")))
          .orderBy(propertyMediaTable.order).limit(1),
        db.select({ cnt: count() }).from(propertyMediaTable).where(eq(propertyMediaTable.propertyId, p.id)),
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

    // Increment view count
    await db.update(propertiesTable).set({ viewCount: property.viewCount + 1 }).where(eq(propertiesTable.id, id));

    const agentId = property.currentAgentId || property.ownerAgentId;
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
    const data = req.body;
    const [property] = await db.insert(propertiesTable).values({
      ...data,
      ownerAgentId: user.id,
      currentAgentId: user.id,
      agencyId: data.agencyId || user.agencyId,
    }).returning();

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

// PATCH /properties/:id
router.patch("/properties/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const [updated] = await db.update(propertiesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(propertiesTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Bien non trouvé" }); return; }
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
    const [updated] = await db.update(propertiesTable).set({ status: "published", updatedAt: new Date() }).where(eq(propertiesTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Bien non trouvé" }); return; }
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
    const [media] = await db.insert(propertyMediaTable).values({
      ...req.body,
      propertyId: parseInt(req.params.id as string),
    }).returning();
    res.status(201).json(media);
  } catch (err) {
    logger.error({ err }, "Add media error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /properties/:id/media/:mediaId
router.delete("/properties/:id/media/:mediaId", requireAuth, async (req, res) => {
  try {
    await db.delete(propertyMediaTable).where(eq(propertyMediaTable.id, parseInt(req.params.mediaId as string)));
    res.status(204).send();
  } catch (err) {
    logger.error({ err }, "Delete media error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /properties/:id/assign
router.post("/properties/:id/assign", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, parseInt(req.params.id as string)));
    if (!property) { res.status(404).json({ error: "Bien non trouvé" }); return; }
    const [assignment] = await db.insert(propertyAssignmentsTable).values({
      propertyId: property.id,
      ownerAgentId: property.ownerAgentId,
      temporaryAgentId: req.body.temporaryAgentId,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      reason: req.body.reason || null,
    }).returning();
    // Update property current agent
    await db.update(propertiesTable).set({ currentAgentId: req.body.temporaryAgentId }).where(eq(propertiesTable.id, property.id));
    res.status(201).json(assignment);
  } catch (err) {
    logger.error({ err }, "Assign property error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
