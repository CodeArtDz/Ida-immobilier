import { Router } from "express";
import { db } from "@workspace/db";
import { favoritesTable, propertiesTable, propertyMediaTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router = Router();

// GET /favorites
router.get("/favorites", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const favs = await db.select().from(favoritesTable).where(eq(favoritesTable.userId, user.id));
    const enriched = await Promise.all(favs.map(async (fav) => {
      const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, fav.propertyId));
      let mainImageUrl = null;
      if (property) {
        const [img] = await db.select({ url: propertyMediaTable.url }).from(propertyMediaTable)
          .where(and(eq(propertyMediaTable.propertyId, property.id), eq(propertyMediaTable.type, "photo")))
          .orderBy(propertyMediaTable.order).limit(1);
        mainImageUrl = img?.url ?? null;
      }
      return {
        ...fav,
        property: property ? { ...property, salePrice: property.salePrice ? parseFloat(property.salePrice) : null, rentalPrice: property.rentalPrice ? parseFloat(property.rentalPrice) : null, charges: property.charges ? parseFloat(property.charges) : null, agencyFees: property.agencyFees ? parseFloat(property.agencyFees) : null, taxeFonciere: property.taxeFonciere ? parseFloat(property.taxeFonciere) : null, annualEnergyCost: property.annualEnergyCost ? parseFloat(property.annualEnergyCost) : null, agentName: null, agentPhone: null, agentEmail: null, agentAvatarUrl: null, agencyName: null, mainImageUrl, mediaCount: 0 } : null,
      };
    }));
    res.json(enriched);
  } catch (err) {
    logger.error({ err }, "List favorites error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /favorites
router.post("/favorites", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const [fav] = await db.insert(favoritesTable).values({ userId: user.id, propertyId: req.body.propertyId }).returning();
    const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, fav.propertyId));
    res.status(201).json({ ...fav, property: property ? { ...property, salePrice: property.salePrice ? parseFloat(property.salePrice) : null, rentalPrice: property.rentalPrice ? parseFloat(property.rentalPrice) : null, charges: null, agencyFees: null, taxeFonciere: null, annualEnergyCost: null, agentName: null, agentPhone: null, agentEmail: null, agentAvatarUrl: null, agencyName: null, mainImageUrl: null, mediaCount: 0 } : null });
  } catch (err) {
    logger.error({ err }, "Add favorite error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /favorites/:propertyId
router.delete("/favorites/:propertyId", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    await db.delete(favoritesTable).where(and(eq(favoritesTable.userId, user.id), eq(favoritesTable.propertyId, parseInt(req.params.propertyId as string))));
    res.status(204).send();
  } catch (err) {
    logger.error({ err }, "Remove favorite error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
