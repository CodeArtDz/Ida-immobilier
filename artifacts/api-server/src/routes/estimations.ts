import { Router } from "express";
import { db } from "@workspace/db";
import { estimationsTable, usersTable, activityLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router = Router();

const enrichEstimation = async (est: any) => {
  let agentName = null;
  if (est.assignedAgentId) {
    const [agent] = await db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName }).from(usersTable).where(eq(usersTable.id, est.assignedAgentId));
    agentName = agent ? `${agent.firstName} ${agent.lastName}` : null;
  }
  return {
    ...est,
    estimatedMinPrice: est.estimatedMinPrice ? parseFloat(est.estimatedMinPrice) : null,
    estimatedMaxPrice: est.estimatedMaxPrice ? parseFloat(est.estimatedMaxPrice) : null,
    agentName,
  };
};

router.get("/estimations", requireAuth, async (_req, res) => {
  try {
    const ests = await db.select().from(estimationsTable);
    const enriched = await Promise.all(ests.map(enrichEstimation));
    res.json(enriched);
  } catch (err) {
    logger.error({ err }, "List estimations error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/estimations/:id", requireAuth, async (req, res) => {
  try {
    const [est] = await db.select().from(estimationsTable).where(eq(estimationsTable.id, parseInt(req.params.id as string)));
    if (!est) { res.status(404).json({ error: "Estimation non trouvée" }); return; }
    res.json(await enrichEstimation(est));
  } catch (err) {
    logger.error({ err }, "Get estimation error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/estimations", optionalAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const [est] = await db.insert(estimationsTable).values(req.body).returning();
    await db.insert(activityLogsTable).values({
      type: "estimation_requested",
      description: `Demande d'estimation : ${est.address}, ${est.city}`,
      entityId: est.id,
      entityType: "estimation",
      actorId: user?.id ?? null,
    });
    res.status(201).json(await enrichEstimation(est));
  } catch (err) {
    logger.error({ err }, "Create estimation error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.patch("/estimations/:id", requireAuth, async (req, res) => {
  try {
    const data = { ...req.body, updatedAt: new Date() };
    const [updated] = await db.update(estimationsTable).set(data).where(eq(estimationsTable.id, parseInt(req.params.id as string))).returning();
    if (!updated) { res.status(404).json({ error: "Estimation non trouvée" }); return; }
    res.json(await enrichEstimation(updated));
  } catch (err) {
    logger.error({ err }, "Update estimation error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
