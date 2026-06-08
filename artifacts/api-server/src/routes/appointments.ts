import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, propertiesTable, usersTable, activityLogsTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { requireAuth, requireRole, optionalAuth } from "../lib/auth";
import { sendAppointmentUpdateEmail, type AppointmentEmailKind } from "../lib/mailer";
import { logger } from "../lib/logger";

const STAFF_ROLES = ["superadmin", "admin", "agency_manager", "agent"] as const;

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
router.post("/appointments", optionalAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    // Guests (no account) can request a visit, so clientId must come from a real
    // logged-in user only — never trust a clientId in the request body.
    const { clientId: _ignoredClientId, ...body } = req.body ?? {};
    const [appt] = await db.insert(appointmentsTable).values({
      ...body,
      clientId: user?.id ?? null,
      scheduledAt: new Date(req.body.scheduledAt),
    }).returning();
    await db.insert(activityLogsTable).values({
      type: "appointment_booked",
      description: `Rendez-vous planifié`,
      entityId: appt.id,
      entityType: "appointment",
      actorId: user?.id ?? null,
    });
    res.status(201).json(await enrichAppointment(appt));
  } catch (err) {
    logger.error({ err }, "Create appointment error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /appointments/:id
router.patch("/appointments/:id", requireAuth, requireRole(...STAFF_ROLES), async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const [existing] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id));
    if (!existing) { res.status(404).json({ error: "Rendez-vous non trouvé" }); return; }

    const data = { ...req.body, updatedAt: new Date() };
    if (data.scheduledAt) data.scheduledAt = new Date(data.scheduledAt);
    const [updated] = await db.update(appointmentsTable).set(data).where(eq(appointmentsTable.id, id)).returning();
    const enriched = await enrichAppointment(updated);

    // Notify the requester by email when the appointment is confirmed, refused, or rescheduled.
    const statusChanged = data.status && data.status !== existing.status;
    const timeChanged = data.scheduledAt && new Date(data.scheduledAt).getTime() !== existing.scheduledAt.getTime();
    let kind: AppointmentEmailKind | null = null;
    if (statusChanged && data.status === "confirmed") kind = "confirmed";
    else if (statusChanged && data.status === "cancelled") kind = "cancelled";
    else if (timeChanged && updated.status !== "cancelled") kind = "rescheduled";

    if (kind) {
      // Always notify the email the requester originally used to book (the pre-update column),
      // falling back to the linked account's email — never an address from the update payload.
      const recipient = existing.clientEmail || enriched.clientEmail;
      if (recipient) {
        await sendAppointmentUpdateEmail({
          to: recipient,
          clientName: enriched.clientName,
          kind,
          appointmentType: updated.type,
          scheduledAt: updated.scheduledAt,
          durationMinutes: updated.durationMinutes,
          propertyTitle: enriched.propertyTitle,
          propertyAddress: enriched.propertyAddress,
          agentName: enriched.agentName,
          notes: updated.notes,
        });
      } else {
        logger.warn({ appointmentId: id }, "Appointment updated but no recipient email — notification skipped");
      }
    }

    res.json(enriched);
  } catch (err) {
    logger.error({ err }, "Update appointment error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /appointments/:id
router.delete("/appointments/:id", requireAuth, requireRole(...STAFF_ROLES), async (req, res) => {
  try {
    await db.delete(appointmentsTable).where(eq(appointmentsTable.id, parseInt(req.params.id as string)));
    res.status(204).send();
  } catch (err) {
    logger.error({ err }, "Delete appointment error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
