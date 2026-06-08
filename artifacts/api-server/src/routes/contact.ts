import { Router } from "express";
import { db } from "@workspace/db";
import {
  propertiesTable,
  usersTable,
  leadsTable,
  conversationsTable,
  conversationParticipantsTable,
  messagesTable,
  activityLogsTable,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { sendPropertyContactEmails, ADMIN_EMAIL } from "../lib/mailer";
import { logger } from "../lib/logger";

const router = Router();

/**
 * POST /contact/property/:id
 * Public endpoint — guest or logged-in user sends a message to the agent.
 * Creates: lead record, platform conversation + message, sends emails.
 */
router.post("/contact/property/:id", async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id as string);
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      res.status(400).json({ error: "Nom, email et message sont requis." });
      return;
    }

    // Split full name into first/last for the leads table
    const nameParts = (name as string).trim().split(/\s+/);
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(" ") || "-";

    // Fetch property + agent
    const [property] = await db
      .select()
      .from(propertiesTable)
      .where(eq(propertiesTable.id, propertyId));

    if (!property) {
      res.status(404).json({ error: "Bien non trouvé." });
      return;
    }

    const agentId = property.currentAgentId || property.ownerAgentId;
    const [agent] = await db
      .select({
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        email: usersTable.email,
      })
      .from(usersTable)
      .where(eq(usersTable.id, agentId));

    // Find admin users to CC on conversation
    const admins = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(inArray(usersTable.role as any, ["superadmin", "admin"]));

    // ── 1. Create a lead record ─────────────────────────────────────────────
    await db.insert(leadsTable).values({
      firstName,
      lastName,
      email,
      phone: phone || null,
      source: "property_inquiry",
      status: "new",
      message,
      propertyId,
      assignedAgentId: agentId || null,
    });

    // ── 2. Create platform conversation ────────────────────────────────────
    const [conv] = await db
      .insert(conversationsTable)
      .values({
        subject: `Contact — ${property.title}`,
        propertyId,
        lastMessageAt: new Date(),
      })
      .returning();

    // Add agent + admins as participants
    const participantIds = Array.from(
      new Set([
        ...(agent ? [agent.id] : []),
        ...admins.map((a) => a.id),
      ])
    );

    await Promise.all(
      participantIds.map((uid) =>
        db.insert(conversationParticipantsTable).values({
          conversationId: conv.id,
          userId: uid,
          unreadCount: 1,
        })
      )
    );

    // Store message — use agent as senderId placeholder for guest, embed contact info in body
    const messageBody = `📩 Message de ${name} <${email}>${phone ? ` · ${phone}` : ""}\n\n${message}`;
    await db.insert(messagesTable).values({
      conversationId: conv.id,
      senderId: agentId,
      body: messageBody,
    });

    // Activity log
    await db.insert(activityLogsTable).values({
      type: "message_sent" as any,
      description: `Message de contact reçu pour le bien IDA-${propertyId} de la part de ${name}`,
      entityId: conv.id,
      entityType: "conversation",
      actorId: agentId,
    });

    // ── 3. Send emails ──────────────────────────────────────────────────────
    const emailSent = await sendPropertyContactEmails({
      senderName: name,
      senderEmail: email,
      senderPhone: phone,
      message,
      propertyTitle: property.title,
      propertyId,
      propertyCity: property.city,
      agentName: agent ? `${agent.firstName} ${agent.lastName}` : "Conseiller I.D.A",
      agentEmail: agent?.email || ADMIN_EMAIL,
      adminEmail: ADMIN_EMAIL,
    });

    res.status(201).json({
      ok: true,
      conversationId: conv.id,
      emailSent,
    });
  } catch (err) {
    logger.error({ err }, "Property contact error");
    res.status(500).json({ error: "Erreur serveur." });
  }
});

export default router;
