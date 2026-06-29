import { Router } from "express";
import { db, articlesTable, citiesTable, usersTable } from "@workspace/db";
import { eq, and, desc, sql, count, type SQL } from "drizzle-orm";
import { slugify } from "@workspace/seo";
import { requireAuth, requireRole, optionalAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router = Router();

const STAFF_ROLES = ["superadmin", "admin", "agency_manager", "agent"];

function isStaff(req: import("express").Request): boolean {
  const user = (req as any).user;
  return Boolean(user && STAFF_ROLES.includes(user.role));
}

// Shape an article row (+ joined city/author) into the API contract.
function shapeArticle(row: {
  article: typeof articlesTable.$inferSelect;
  cityName: string | null;
  citySlug: string | null;
  authorFirstName: string | null;
  authorLastName: string | null;
}) {
  const a = row.article;
  const authorName =
    row.authorFirstName || row.authorLastName
      ? `${row.authorFirstName ?? ""} ${row.authorLastName ?? ""}`.trim()
      : null;
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    body: a.body,
    coverImageUrl: a.coverImageUrl,
    coverImageAlt: a.coverImageAlt,
    tags: a.tags ? a.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    cityId: a.cityId,
    cityName: row.cityName,
    citySlug: row.citySlug,
    metaTitle: a.metaTitle,
    metaDescription: a.metaDescription,
    authorId: a.authorId,
    authorName,
    status: a.status,
    publishedAt: a.publishedAt ? new Date(a.publishedAt).toISOString() : null,
    createdAt: new Date(a.createdAt).toISOString(),
    updatedAt: a.updatedAt ? new Date(a.updatedAt).toISOString() : null,
  };
}

const baseSelect = {
  article: articlesTable,
  cityName: citiesTable.name,
  citySlug: citiesTable.slug,
  authorFirstName: usersTable.firstName,
  authorLastName: usersTable.lastName,
};

function baseQuery() {
  return db
    .select(baseSelect)
    .from(articlesTable)
    .leftJoin(citiesTable, eq(articlesTable.cityId, citiesTable.id))
    .leftJoin(usersTable, eq(articlesTable.authorId, usersTable.id));
}

// Ensure a unique slug from a title or supplied slug, ignoring a given id (update).
async function uniqueSlug(desired: string, ignoreId?: number): Promise<string> {
  const base = slugify(desired) || "article";
  let candidate = base;
  let n = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const rows = await db
      .select({ id: articlesTable.id })
      .from(articlesTable)
      .where(eq(articlesTable.slug, candidate));
    const taken = rows.some((r) => r.id !== ignoreId);
    if (!taken) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
  }
}

// ─── GET /articles ──────────────────────────────────────────────────────────
router.get("/articles", optionalAuth, async (req, res) => {
  try {
    const { status, cityId, tag, search } = req.query as Record<string, string>;
    const page = Math.max(1, parseInt((req.query.page as string) ?? "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) ?? "12", 10) || 12));
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (isStaff(req)) {
      if (status === "draft" || status === "published") {
        conditions.push(eq(articlesTable.status, status));
      }
    } else {
      // Public callers only ever see published articles.
      conditions.push(eq(articlesTable.status, "published"));
    }
    if (cityId) {
      const cid = parseInt(cityId, 10);
      if (!Number.isNaN(cid)) conditions.push(eq(articlesTable.cityId, cid));
    }
    if (tag) {
      conditions.push(sql`',' || ${articlesTable.tags} || ',' ILIKE ${"%," + tag + ",%"}`);
    }
    if (search) {
      conditions.push(
        sql`(${articlesTable.title} ILIKE ${"%" + search + "%"} OR ${articlesTable.excerpt} ILIKE ${"%" + search + "%"})`,
      );
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const rows = await baseQuery()
      .where(where)
      .orderBy(desc(articlesTable.publishedAt), desc(articlesTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(articlesTable)
      .where(where);

    res.json({
      data: rows.map(shapeArticle),
      total: Number(total),
      page,
      limit,
    });
  } catch (err) {
    logger.error({ err }, "List articles error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── GET /articles/slug/:slug ─────────────────────────────────────────────────
router.get("/articles/slug/:slug", optionalAuth, async (req, res) => {
  try {
    const slug = req.params.slug as string;
    const [row] = await baseQuery().where(eq(articlesTable.slug, slug)).limit(1);
    if (!row || (row.article.status !== "published" && !isStaff(req))) {
      res.status(404).json({ error: "Article non trouvé" });
      return;
    }
    res.json(shapeArticle(row));
  } catch (err) {
    logger.error({ err }, "Get article by slug error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── GET /articles/:id ────────────────────────────────────────────────────────
router.get("/articles/:id", optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Identifiant invalide" });
      return;
    }
    const [row] = await baseQuery().where(eq(articlesTable.id, id)).limit(1);
    if (!row || (row.article.status !== "published" && !isStaff(req))) {
      res.status(404).json({ error: "Article non trouvé" });
      return;
    }
    res.json(shapeArticle(row));
  } catch (err) {
    logger.error({ err }, "Get article error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── POST /articles ───────────────────────────────────────────────────────────
router.post(
  "/articles",
  requireAuth,
  requireRole(...STAFF_ROLES),
  async (req, res) => {
    try {
      const body = req.body ?? {};
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title) {
        res.status(400).json({ error: "Le titre est requis" });
        return;
      }
      const slug = await uniqueSlug(body.slug || title);
      const status = body.status === "published" ? "published" : "draft";
      const tags = Array.isArray(body.tags)
        ? body.tags.map((t: string) => t.trim()).filter(Boolean).join(",")
        : "";
      const user = (req as any).user;

      const [created] = await db
        .insert(articlesTable)
        .values({
          slug,
          title,
          excerpt: body.excerpt ?? null,
          body: body.body ?? "",
          coverImageUrl: body.coverImageUrl ?? null,
          coverImageAlt: body.coverImageAlt ?? null,
          tags,
          cityId: body.cityId ?? null,
          metaTitle: body.metaTitle ?? null,
          metaDescription: body.metaDescription ?? null,
          authorId: user?.id ?? null,
          status,
          publishedAt: status === "published" ? new Date() : null,
        })
        .returning();

      const [row] = await baseQuery().where(eq(articlesTable.id, created.id)).limit(1);
      res.status(201).json(shapeArticle(row));
    } catch (err) {
      logger.error({ err }, "Create article error");
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// ─── PATCH /articles/:id ──────────────────────────────────────────────────────
router.patch(
  "/articles/:id",
  requireAuth,
  requireRole(...STAFF_ROLES),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Identifiant invalide" });
        return;
      }
      const [existing] = await db.select().from(articlesTable).where(eq(articlesTable.id, id));
      if (!existing) {
        res.status(404).json({ error: "Article non trouvé" });
        return;
      }
      const body = req.body ?? {};
      const updates: Partial<typeof articlesTable.$inferInsert> = {};

      if (typeof body.title === "string") updates.title = body.title.trim();
      if (typeof body.slug === "string" && body.slug.trim()) {
        updates.slug = await uniqueSlug(body.slug, id);
      }
      if ("excerpt" in body) updates.excerpt = body.excerpt ?? null;
      if ("body" in body) updates.body = body.body ?? "";
      if ("coverImageUrl" in body) updates.coverImageUrl = body.coverImageUrl ?? null;
      if ("coverImageAlt" in body) updates.coverImageAlt = body.coverImageAlt ?? null;
      if (Array.isArray(body.tags)) {
        updates.tags = body.tags.map((t: string) => t.trim()).filter(Boolean).join(",");
      }
      if ("cityId" in body) updates.cityId = body.cityId ?? null;
      if ("metaTitle" in body) updates.metaTitle = body.metaTitle ?? null;
      if ("metaDescription" in body) updates.metaDescription = body.metaDescription ?? null;
      if (body.status === "draft" || body.status === "published") {
        updates.status = body.status;
        if (body.status === "published" && existing.status !== "published") {
          updates.publishedAt = new Date();
        }
        if (body.status === "draft") {
          updates.publishedAt = null;
        }
      }
      updates.updatedAt = new Date();

      await db.update(articlesTable).set(updates).where(eq(articlesTable.id, id));
      const [row] = await baseQuery().where(eq(articlesTable.id, id)).limit(1);
      res.json(shapeArticle(row));
    } catch (err) {
      logger.error({ err }, "Update article error");
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// ─── DELETE /articles/:id ─────────────────────────────────────────────────────
router.delete(
  "/articles/:id",
  requireAuth,
  requireRole(...STAFF_ROLES),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Identifiant invalide" });
        return;
      }
      await db.delete(articlesTable).where(eq(articlesTable.id, id));
      res.status(204).send();
    } catch (err) {
      logger.error({ err }, "Delete article error");
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// ─── PATCH /articles/:id/publish ──────────────────────────────────────────────
router.patch(
  "/articles/:id/publish",
  requireAuth,
  requireRole(...STAFF_ROLES),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Identifiant invalide" });
        return;
      }
      const [existing] = await db.select().from(articlesTable).where(eq(articlesTable.id, id));
      if (!existing) {
        res.status(404).json({ error: "Article non trouvé" });
        return;
      }
      await db
        .update(articlesTable)
        .set({
          status: "published",
          publishedAt: existing.publishedAt ?? new Date(),
          updatedAt: new Date(),
        })
        .where(eq(articlesTable.id, id));
      const [row] = await baseQuery().where(eq(articlesTable.id, id)).limit(1);
      res.json(shapeArticle(row));
    } catch (err) {
      logger.error({ err }, "Publish article error");
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// ─── PATCH /articles/:id/unpublish ────────────────────────────────────────────
router.patch(
  "/articles/:id/unpublish",
  requireAuth,
  requireRole(...STAFF_ROLES),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Identifiant invalide" });
        return;
      }
      const [existing] = await db.select().from(articlesTable).where(eq(articlesTable.id, id));
      if (!existing) {
        res.status(404).json({ error: "Article non trouvé" });
        return;
      }
      await db
        .update(articlesTable)
        .set({ status: "draft", updatedAt: new Date() })
        .where(eq(articlesTable.id, id));
      const [row] = await baseQuery().where(eq(articlesTable.id, id)).limit(1);
      res.json(shapeArticle(row));
    } catch (err) {
      logger.error({ err }, "Unpublish article error");
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

export default router;
