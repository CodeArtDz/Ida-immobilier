import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, generateToken, storeToken, revokeToken, requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router = Router();

// GET /auth/me
router.get("/auth/me", requireAuth, async (req, res) => {
  const user = (req as any).user;
  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    agencyId: user.agencyId,
    isActive: user.isActive,
    createdAt: user.createdAt,
  });
});

// POST /auth/login
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email et mot de passe requis" });
    return;
  }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
    if (!user) {
      res.status(401).json({ error: "Identifiants incorrects" });
      return;
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Identifiants incorrects" });
      return;
    }
    if (!user.isActive) {
      res.status(401).json({ error: "Compte désactivé" });
      return;
    }
    const token = generateToken();
    await storeToken(token, user.id);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        agencyId: user.agencyId,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    logger.error({ err }, "Login error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /auth/register
router.post("/auth/register", async (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body;
  if (!email || !password || !firstName || !lastName) {
    res.status(400).json({ error: "Champs requis manquants" });
    return;
  }
  try {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
    if (existing) {
      res.status(409).json({ error: "Email déjà utilisé" });
      return;
    }
    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(usersTable).values({
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      phone: phone || null,
      role: "client",
    }).returning();
    const token = generateToken();
    await storeToken(token, user.id);
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        agencyId: user.agencyId,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    logger.error({ err }, "Register error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /auth/logout
router.post("/auth/logout", requireAuth, async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    await revokeToken(authHeader.slice(7));
  }
  res.json({ status: "ok" });
});

export default router;
