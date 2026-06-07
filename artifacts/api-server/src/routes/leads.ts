import { Router } from "express";
import { db } from "@workspace/db";
import { leadsTable, propertiesTable, usersTable, activityLogsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router = Router();

const enrichLead = async (lead: any) => {
  const [property, agent] = await Promise.all([
    lead.propertyId ? db.select({ title: propertiesTable.title }).from(propertiesTable).where(eq(propertiesTable.id, lead.propertyId)).then(r => r[0]) : null,
    lead.assignedAgentId ? db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName }).from(usersTable).where(eq(usersTable.id, lead.assignedAgentId)).then(r => r[0]) : null,
  ]);
  return {
    ...lead,
    propertyTitle: property?.title ?? null,
    agentName: agent ? `${agent.firstName} ${agent.lastName}` : null,
  };
};

// GET /leads
router.get("/leads", requireAuth, async (req, res) => {
  try {
    const { status, agentId, source } = req.query as Record<string, string>;
    const conditions = [];
    if (status) conditions.push(eq(leadsTable.status, status as any));
    if (agentId) conditions.push(eq(leadsTable.assignedAgentId, parseInt(agentId)));
    if (source) conditions.push(eq(leadsTable.source, source as any));
    const leads = conditions.length > 0
      ? await db.select().from(leadsTable).where(and(...conditions))
      : await db.select().from(leadsTable);
    const enriched = await Promise.all(leads.map(enrichLead));
    res.json(enriched);
  } catch (err) {
    logger.error({ err }, "List leads error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /leads/stats
router.get("/leads/stats", requireAuth, async (_req, res) => {
  try {
    const [byStatus, bySource, [total]] = await Promise.all([
      db.select({ label: leadsTable.status, count: count() }).from(leadsTable).groupBy(leadsTable.status),
      db.select({ label: leadsTable.source, count: count() }).from(leadsTable).groupBy(leadsTable.source),
      db.select({ count: count() }).from(leadsTable),
    ]);
    res.json({
      total: total?.count ?? 0,
      byStatus: byStatus.map(r => ({ label: r.label, count: r.count, value: null })),
      bySource: bySource.map(r => ({ label: r.label, count: r.count, value: null })),
    });
  } catch (err) {
    logger.error({ err }, "Lead stats error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /leads/:id
router.get("/leads/:id", requireAuth, async (req, res) => {
  try {
    const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, parseInt(req.params.id as string)));
    if (!lead) { res.status(404).json({ error: "Lead non trouvé" }); return; }
    res.json(await enrichLead(lead));
  } catch (err) {
    logger.error({ err }, "Get lead error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /leads
router.post("/leads", optionalAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { propertyId, ...rest } = req.body;

    // Auto-assign to property's agent if property specified
    let assignedAgentId = null;
    let agencyId = null;
    if (propertyId) {
      const [prop] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, propertyId));
      if (prop) {
        assignedAgentId = prop.currentAgentId || prop.ownerAgentId;
        agencyId = prop.agencyId;
      }
    }

    const [lead] = await db.insert(leadsTable).values({
      ...rest,
      propertyId: propertyId || null,
      assignedAgentId,
      agencyId,
    }).returning();

    await db.insert(activityLogsTable).values({
      type: "lead_created",
      description: `Nouveau lead : ${lead.firstName} ${lead.lastName}`,
      entityId: lead.id,
      entityType: "lead",
      actorId: user?.id ?? null,
    });

    res.status(201).json(await enrichLead(lead));
  } catch (err) {
    logger.error({ err }, "Create lead error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /leads/:id
router.patch("/leads/:id", requireAuth, async (req, res) => {
  try {
    const [updated] = await db.update(leadsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(leadsTable.id, parseInt(req.params.id as string))).returning();
    if (!updated) { res.status(404).json({ error: "Lead non trouvé" }); return; }
    res.json(await enrichLead(updated));
  } catch (err) {
    logger.error({ err }, "Update lead error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
