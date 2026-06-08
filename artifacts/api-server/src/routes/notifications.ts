import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router = Router();

router.get("/notifications", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { unread } = req.query;
    const conditions = [eq(notificationsTable.userId, user.id)];
    if (unread === "true") conditions.push(eq(notificationsTable.isRead, false));
    const notifs = await db.select().from(notificationsTable).where(and(...conditions));
    res.json(notifs);
  } catch (err) {
    logger.error({ err }, "List notifications error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.patch("/notifications/:id/read", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const [updated] = await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(and(eq(notificationsTable.id, parseInt(req.params.id as string)), eq(notificationsTable.userId, user.id)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Notification non trouvée" }); return; }
    res.json(updated);
  } catch (err) {
    logger.error({ err }, "Mark read error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.patch("/notifications/read-all", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.userId, user.id));
    res.json({ status: "ok" });
  } catch (err) {
    logger.error({ err }, "Mark all read error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
