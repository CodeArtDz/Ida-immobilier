import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, agenciesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, hashPassword } from "../lib/auth";
import { logger } from "../lib/logger";

const router = Router();

const formatUser = (u: any, agencyName?: string | null) => ({
  id: u.id,
  email: u.email,
  firstName: u.firstName,
  lastName: u.lastName,
  role: u.role,
  phone: u.phone,
  avatarUrl: u.avatarUrl,
  agencyId: u.agencyId,
  agencyName: agencyName ?? null,
  isActive: u.isActive,
  createdAt: u.createdAt,
});

// GET /users
router.get("/users", requireAuth, async (req, res) => {
  try {
    const { role, agencyId } = req.query as Record<string, string>;
    const conditions = [];
    if (role) conditions.push(eq(usersTable.role, role as any));
    if (agencyId) conditions.push(eq(usersTable.agencyId, parseInt(agencyId)));

    const users = conditions.length > 0
      ? await db.select().from(usersTable).where(and(...conditions))
      : await db.select().from(usersTable);

    res.json(users.map(u => formatUser(u)));
  } catch (err) {
    logger.error({ err }, "List users error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /users
router.post("/users", requireAuth, async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const passwordHash = await hashPassword(password || "changeme123");
    const [user] = await db.insert(usersTable).values({ ...rest, passwordHash }).returning();
    res.status(201).json(formatUser(user));
  } catch (err) {
    logger.error({ err }, "Create user error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /users/me — must come BEFORE /users/:id
router.get("/users/me", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) { res.status(404).json({ error: "Utilisateur non trouvé" }); return; }
    let agencyName: string | null = null;
    if (user.agencyId) {
      const [agency] = await db.select({ name: agenciesTable.name }).from(agenciesTable).where(eq(agenciesTable.id, user.agencyId));
      agencyName = agency?.name ?? null;
    }
    res.json(formatUser(user, agencyName));
  } catch (err) {
    logger.error({ err }, "Get my profile error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /users/me — must come BEFORE /users/:id
router.patch("/users/me", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { password, role, isActive, agencyId, ...rest } = req.body;
    const updateData: any = { ...rest, updatedAt: new Date() };
    if (password) updateData.passwordHash = await hashPassword(password);
    const [updated] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, userId)).returning();
    if (!updated) { res.status(404).json({ error: "Utilisateur non trouvé" }); return; }
    res.json(formatUser(updated));
  } catch (err) {
    logger.error({ err }, "Update my profile error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /users/:id
router.get("/users/:id", requireAuth, async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, parseInt(req.params.id as string)));
    if (!user) { res.status(404).json({ error: "Utilisateur non trouvé" }); return; }
    let agencyName: string | null = null;
    if (user.agencyId) {
      const [agency] = await db.select({ name: agenciesTable.name }).from(agenciesTable).where(eq(agenciesTable.id, user.agencyId));
      agencyName = agency?.name ?? null;
    }
    res.json(formatUser(user, agencyName));
  } catch (err) {
    logger.error({ err }, "Get user error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /users/:id
router.patch("/users/:id", requireAuth, async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const updateData: any = { ...rest, updatedAt: new Date() };
    if (password) updateData.passwordHash = await hashPassword(password);
    const [updated] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, parseInt(req.params.id as string))).returning();
    if (!updated) { res.status(404).json({ error: "Utilisateur non trouvé" }); return; }
    res.json(formatUser(updated));
  } catch (err) {
    logger.error({ err }, "Update user error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /users/:id/deactivate
router.patch("/users/:id/deactivate", requireAuth, async (req, res) => {
  try {
    const [updated] = await db.update(usersTable).set({ isActive: false, updatedAt: new Date() }).where(eq(usersTable.id, parseInt(req.params.id as string))).returning();
    if (!updated) { res.status(404).json({ error: "Utilisateur non trouvé" }); return; }
    res.json(formatUser(updated));
  } catch (err) {
    logger.error({ err }, "Deactivate user error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
