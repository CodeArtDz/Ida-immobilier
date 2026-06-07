import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, propertiesTable, usersTable, activityLogsTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router = Router();

const enrichAppointment = async (appt: any) => {
  const [property, agent, client] = await Promise.all([
    appt.propertyId ? db.select({ title: propertiesTable.title, address: propertiesTable.address }).from(propertiesTable).where(eq(propertiesTable.id, appt.propertyId)).then(r => r[0]) : null,
    db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName }).from(usersTable).where(eq(usersTable.id, appt.agentId)).then(r => r[0]),
    appt.clientId ? db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName, email: usersTable.email, phone: usersTable.phone }).from(usersTable).where(eq(usersTable.id, appt.clientId)).then(r => r[0]) : null,
  ]);
  return {
    ...appt,
    propertyTitle: property?.title ?? null,
    propertyAddress: property?.address ?? null,
    agentName: agent ? `${agent.firstName} ${agent.lastName}` : null,
    clientName: client ? `${client.firstName} ${client.lastName}` : appt.clientName,
    clientEmail: client?.email ?? appt.clientEmail,
    clientPhone: client?.phone ?? appt.clientPhone,
  };
};

// GET /appointments
router.get("/appointments", requireAuth, async (req, res) => {
  try {
    const { agentId, clientId, propertyId, from, to } = req.query as Record<string, string>;
    const conditions = [];
    if (agentId) conditions.push(eq(appointmentsTable.agentId, parseInt(agentId)));
    if (clientId) conditions.push(eq(appointmentsTable.clientId, parseInt(clientId)));
    if (propertyId) conditions.push(eq(appointmentsTable.propertyId, parseInt(propertyId)));
    if (from) conditions.push(gte(appointmentsTable.scheduledAt, new Date(from)));
    if (to) conditions.push(lte(appointmentsTable.scheduledAt, new Date(to)));
    const appts = conditions.length > 0
      ? await db.select().from(appointmentsTable).where(and(...conditions))
      : await db.select().from(appointmentsTable);
    const enriched = await Promise.all(appts.map(enrichAppointment));
    res.json(enriched);
  } catch (err) {
    logger.error({ err }, "List appointments error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /appointments/:id
router.get("/appointments/:id", requireAuth, async (req, res) => {
  try {
    const [appt] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, parseInt(req.params.id as string)));
    if (!appt) { res.status(404).json({ error: "Rendez-vous non trouvé" }); return; }
    res.json(await enrichAppointment(appt));
  } catch (err) {
    logger.error({ err }, "Get appointment error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /appointments
router.post("/appointments", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const [appt] = await db.insert(appointmentsTable).values({ ...req.body, scheduledAt: new Date(req.body.scheduledAt) }).returning();
    await db.insert(activityLogsTable).values({
      type: "appointment_booked",
      description: `Rendez-vous planifié`,
      entityId: appt.id,
      entityType: "appointment",
      actorId: user.id,
    });
    res.status(201).json(await enrichAppointment(appt));
  } catch (err) {
    logger.error({ err }, "Create appointment error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /appointments/:id
router.patch("/appointments/:id", requireAuth, async (req, res) => {
  try {
    const data = { ...req.body, updatedAt: new Date() };
    if (data.scheduledAt) data.scheduledAt = new Date(data.scheduledAt);
    const [updated] = await db.update(appointmentsTable).set(data).where(eq(appointmentsTable.id, parseInt(req.params.id as string))).returning();
    if (!updated) { res.status(404).json({ error: "Rendez-vous non trouvé" }); return; }
    res.json(await enrichAppointment(updated));
  } catch (err) {
    logger.error({ err }, "Update appointment error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /appointments/:id
router.delete("/appointments/:id", requireAuth, async (req, res) => {
  try {
    await db.delete(appointmentsTable).where(eq(appointmentsTable.id, parseInt(req.params.id as string)));
    res.status(204).send();
  } catch (err) {
    logger.error({ err }, "Delete appointment error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
