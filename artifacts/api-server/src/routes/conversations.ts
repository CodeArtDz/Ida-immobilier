import { Router } from "express";
import { db } from "@workspace/db";
import { conversationsTable, conversationParticipantsTable, messagesTable, usersTable, propertiesTable, activityLogsTable } from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router = Router();

// GET /conversations
router.get("/conversations", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const participations = await db.select().from(conversationParticipantsTable).where(eq(conversationParticipantsTable.userId, user.id));
    const convs = await Promise.all(participations.map(async (p) => {
      const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, p.conversationId));
      if (!conv) return null;
      const [[participantCount], [lastMsg]] = await Promise.all([
        db.select({ count: count() }).from(conversationParticipantsTable).where(eq(conversationParticipantsTable.conversationId, conv.id)),
        db.select({ body: messagesTable.body }).from(messagesTable).where(eq(messagesTable.conversationId, conv.id)).orderBy(desc(messagesTable.createdAt)).limit(1),
      ]);
      let propertyTitle = null;
      if (conv.propertyId) {
        const [prop] = await db.select({ title: propertiesTable.title }).from(propertiesTable).where(eq(propertiesTable.id, conv.propertyId));
        propertyTitle = prop?.title ?? null;
      }
      return {
        ...conv,
        propertyTitle,
        participantCount: participantCount?.count ?? 0,
        lastMessage: lastMsg?.body ?? null,
        lastMessageAt: conv.lastMessageAt?.toISOString() ?? null,
        unreadCount: p.unreadCount,
      };
    }));
    res.json(convs.filter(Boolean));
  } catch (err) {
    logger.error({ err }, "List conversations error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /conversations
router.post("/conversations", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { subject, propertyId, participantIds, initialMessage } = req.body;
    const [conv] = await db.insert(conversationsTable).values({ subject, propertyId: propertyId || null }).returning();

    // Add creator + participants
    const allParticipants = Array.from(new Set([user.id, ...(participantIds || [])]));
    await Promise.all(allParticipants.map(uid =>
      db.insert(conversationParticipantsTable).values({ conversationId: conv.id, userId: uid })
    ));

    // Send initial message if provided
    if (initialMessage) {
      await db.insert(messagesTable).values({ conversationId: conv.id, senderId: user.id, body: initialMessage });
      await db.update(conversationsTable).set({ lastMessageAt: new Date() }).where(eq(conversationsTable.id, conv.id));
      await db.insert(activityLogsTable).values({ type: "message_sent", description: "Message envoyé", entityId: conv.id, entityType: "conversation", actorId: user.id });
    }

    res.status(201).json({ ...conv, propertyTitle: null, participantCount: allParticipants.length, lastMessage: initialMessage || null, lastMessageAt: null, unreadCount: 0 });
  } catch (err) {
    logger.error({ err }, "Create conversation error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /conversations/:id/messages
router.get("/conversations/:id/messages", requireAuth, async (req, res) => {
  try {
    const msgs = await db.select().from(messagesTable)
      .where(eq(messagesTable.conversationId, parseInt(req.params.id as string)))
      .orderBy(messagesTable.createdAt);
    const enriched = await Promise.all(msgs.map(async (m) => {
      const [sender] = await db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName, avatarUrl: usersTable.avatarUrl }).from(usersTable).where(eq(usersTable.id, m.senderId));
      return { ...m, senderName: sender ? `${sender.firstName} ${sender.lastName}` : "Inconnu", senderAvatarUrl: sender?.avatarUrl ?? null };
    }));
    res.json(enriched);
  } catch (err) {
    logger.error({ err }, "List messages error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /conversations/:id/messages
router.post("/conversations/:id/messages", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const convId = parseInt(req.params.id as string);
    const [msg] = await db.insert(messagesTable).values({ conversationId: convId, senderId: user.id, body: req.body.body, attachmentUrl: req.body.attachmentUrl || null }).returning();
    await db.update(conversationsTable).set({ lastMessageAt: new Date() }).where(eq(conversationsTable.id, convId));
    res.status(201).json({ ...msg, senderName: `${user.firstName} ${user.lastName}`, senderAvatarUrl: user.avatarUrl ?? null });
  } catch (err) {
    logger.error({ err }, "Send message error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
