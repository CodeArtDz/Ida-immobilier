import { Router } from "express";
import { db } from "@workspace/db";
import { savedSearchesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router = Router();

router.get("/saved-searches", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const searches = await db.select().from(savedSearchesTable).where(eq(savedSearchesTable.userId, user.id));
    res.json(searches.map(s => ({ ...s, minPrice: s.minPrice ? parseFloat(s.minPrice) : null, maxPrice: s.maxPrice ? parseFloat(s.maxPrice) : null })));
  } catch (err) {
    logger.error({ err }, "List saved searches error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/saved-searches", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const [search] = await db.insert(savedSearchesTable).values({ ...req.body, userId: user.id }).returning();
    res.status(201).json({ ...search, minPrice: search.minPrice ? parseFloat(search.minPrice) : null, maxPrice: search.maxPrice ? parseFloat(search.maxPrice) : null });
  } catch (err) {
    logger.error({ err }, "Create saved search error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.delete("/saved-searches/:id", requireAuth, async (req, res) => {
  try {
    await db.delete(savedSearchesTable).where(eq(savedSearchesTable.id, parseInt(req.params.id as string)));
    res.status(204).send();
  } catch (err) {
    logger.error({ err }, "Delete saved search error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
