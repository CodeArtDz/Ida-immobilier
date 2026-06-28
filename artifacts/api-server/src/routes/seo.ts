import { Router } from "express";
import { db, citiesTable, usersTable, propertiesTable, agenciesTable } from "@workspace/db";
import { eq, and, inArray, count, asc } from "drizzle-orm";
import { buildAgentSlug, idFromSlug } from "@workspace/seo";
import { logger } from "../lib/logger";

const router = Router();

// GET /cities — full registry (lightweight) for SEO pages, links and sitemaps.
router.get("/cities", async (_req, res) => {
  try {
    const cities = await db.select().from(citiesTable).orderBy(asc(citiesTable.displayOrder));
    res.json(cities);
  } catch (err) {
    logger.error({ err }, "List cities error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /cities/:slug — city + market stats + nearby cities.
router.get("/cities/:slug", async (req, res) => {
  try {
    const slug = req.params.slug as string;
    const [city] = await db.select().from(citiesTable).where(eq(citiesTable.slug, slug));
    if (!city) { res.status(404).json({ error: "Ville non trouvée" }); return; }

    // Stats: published listings whose city matches by name.
    const rows = await db
      .select({
        type: propertiesTable.type,
        salePrice: propertiesTable.salePrice,
        rentalPrice: propertiesTable.rentalPrice,
        livingArea: propertiesTable.livingArea,
      })
      .from(propertiesTable)
      .where(and(eq(propertiesTable.status, "published"), eq(propertiesTable.city, city.name)));

    const sales = rows.map((r) => (r.salePrice ? parseFloat(r.salePrice) : null)).filter((n): n is number => n != null);
    const rentals = rows.map((r) => (r.rentalPrice ? parseFloat(r.rentalPrice) : null)).filter((n): n is number => n != null);
    const pricePerM2 = rows
      .map((r) => {
        const price = r.salePrice ? parseFloat(r.salePrice) : null;
        return price && r.livingArea ? price / r.livingArea : null;
      })
      .filter((n): n is number => n != null);
    const avg = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);

    const byTypeMap = new Map<string, { count: number; total: number }>();
    for (const r of rows) {
      const entry = byTypeMap.get(r.type) ?? { count: 0, total: 0 };
      entry.count += 1;
      if (r.salePrice) entry.total += parseFloat(r.salePrice);
      byTypeMap.set(r.type, entry);
    }

    const stats = {
      count: rows.length,
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
    };

    const nearbySlugs = city.nearbyCitySlugs.split(",").map((s) => s.trim()).filter(Boolean);
    const nearby = nearbySlugs.length
      ? await db.select().from(citiesTable).where(inArray(citiesTable.slug, nearbySlugs))
      : [];
    // Preserve the order declared in nearbyCitySlugs.
    nearby.sort((a, b) => nearbySlugs.indexOf(a.slug) - nearbySlugs.indexOf(b.slug));

    res.json({ city, stats, nearby });
  } catch (err) {
    logger.error({ err }, "Get city detail error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /agents/:slug — public agent profile. Slug embeds the user id as its
// trailing segment (e.g. `marie-laurent-3`).
router.get("/agents/:slug", async (req, res) => {
  try {
    const slug = req.params.slug as string;
    const id = idFromSlug(slug);
    if (id == null) { res.status(404).json({ error: "Agent non trouvé" }); return; }

    const [agent] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (!agent || !["agent", "agency_manager", "admin", "superadmin"].includes(agent.role) || !agent.isActive) {
      res.status(404).json({ error: "Agent non trouvé" }); return;
    }

    const [agency, [{ value: propertyCount } = { value: 0 }]] = await Promise.all([
      agent.agencyId
        ? db.select({ name: agenciesTable.name }).from(agenciesTable).where(eq(agenciesTable.id, agent.agencyId)).then((r) => r[0])
        : Promise.resolve(undefined),
      db
        .select({ value: count() })
        .from(propertiesTable)
        .where(and(eq(propertiesTable.currentAgentId, agent.id), eq(propertiesTable.status, "published"))),
    ]);

    res.json({
      id: agent.id,
      slug: buildAgentSlug(agent),
      firstName: agent.firstName,
      lastName: agent.lastName,
      role: agent.role,
      email: agent.email,
      phone: agent.phone,
      avatarUrl: agent.avatarUrl,
      bio: (agent as any).bio ?? null,
      jobTitle: (agent as any).jobTitle ?? null,
      agencyId: agent.agencyId ?? null,
      agencyName: agency?.name ?? null,
      propertyCount,
    });
  } catch (err) {
    logger.error({ err }, "Get agent profile error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
