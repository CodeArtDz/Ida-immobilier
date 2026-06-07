import { Router } from "express";
import { db } from "@workspace/db";
import { agenciesTable, usersTable, propertiesTable, leadsTable, appointmentsTable } from "@workspace/db";
import { eq, count, avg } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router = Router();

// GET /agencies
router.get("/agencies", async (_req, res) => {
  try {
    const agencies = await db.select().from(agenciesTable).orderBy(agenciesTable.name);
    const enriched = await Promise.all(agencies.map(async (a) => {
      const [[agentCount], [propCount]] = await Promise.all([
        db.select({ count: count() }).from(usersTable).where(eq(usersTable.agencyId, a.id)),
        db.select({ count: count() }).from(propertiesTable).where(eq(propertiesTable.agencyId, a.id)),
      ]);
      return { ...a, agentCount: agentCount?.count ?? 0, propertyCount: propCount?.count ?? 0 };
    }));
    res.json(enriched);
  } catch (err) {
    logger.error({ err }, "List agencies error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /agencies
router.post("/agencies", requireAuth, async (req, res) => {
  try {
    const [agency] = await db.insert(agenciesTable).values(req.body).returning();
    res.status(201).json({ ...agency, agentCount: 0, propertyCount: 0 });
  } catch (err) {
    logger.error({ err }, "Create agency error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /agencies/:id
router.get("/agencies/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const [agency] = await db.select().from(agenciesTable).where(eq(agenciesTable.id, id));
    if (!agency) { res.status(404).json({ error: "Agence non trouvée" }); return; }
    const [[agentCount], [propCount]] = await Promise.all([
      db.select({ count: count() }).from(usersTable).where(eq(usersTable.agencyId, id)),
      db.select({ count: count() }).from(propertiesTable).where(eq(propertiesTable.agencyId, id)),
    ]);
    res.json({ ...agency, agentCount: agentCount?.count ?? 0, propertyCount: propCount?.count ?? 0 });
  } catch (err) {
    logger.error({ err }, "Get agency error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /agencies/:id
router.patch("/agencies/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const [updated] = await db.update(agenciesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(agenciesTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Agence non trouvée" }); return; }
    res.json({ ...updated, agentCount: 0, propertyCount: 0 });
  } catch (err) {
    logger.error({ err }, "Update agency error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /agencies/:id/agents
router.get("/agencies/:id/agents", async (req, res) => {
  try {
    const agents = await db.select().from(usersTable).where(eq(usersTable.agencyId, parseInt(req.params.id as string)));
    res.json(agents.map(u => ({ id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role, phone: u.phone, avatarUrl: u.avatarUrl, agencyId: u.agencyId, agencyName: null, isActive: u.isActive, createdAt: u.createdAt })));
  } catch (err) {
    logger.error({ err }, "List agents error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /agencies/:id/stats
router.get("/agencies/:id/stats", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const [[agentCount], [propTotal], [propPublished], [leadCount], [apptCount], [avgPrice]] = await Promise.all([
      db.select({ count: count() }).from(usersTable).where(eq(usersTable.agencyId, id)),
      db.select({ count: count() }).from(propertiesTable).where(eq(propertiesTable.agencyId, id)),
      db.select({ count: count() }).from(propertiesTable).where(eq(propertiesTable.agencyId, id)),
      db.select({ count: count() }).from(leadsTable).where(eq(leadsTable.agencyId, id)),
      db.select({ count: count() }).from(appointmentsTable),
      db.select({ avg: avg(propertiesTable.salePrice) }).from(propertiesTable).where(eq(propertiesTable.agencyId, id)),
    ]);
    res.json({
      totalAgents: agentCount?.count ?? 0,
      totalProperties: propTotal?.count ?? 0,
      publishedProperties: propPublished?.count ?? 0,
      totalLeads: leadCount?.count ?? 0,
      totalAppointments: apptCount?.count ?? 0,
      avgPropertyPrice: avgPrice?.avg ? parseFloat(avgPrice.avg) : null,
    });
  } catch (err) {
    logger.error({ err }, "Agency stats error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
