import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Blog / editorial content powering /blog and the "latest articles" slots on
// city pages. One row per article (buying/selling guides, neighborhood pieces,
// market news). Authored by staff (admin/agency_manager/agent).
export const articleStatusEnum = pgEnum("article_status", ["draft", "published"]);

export const articlesTable = pgTable("articles", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  // Rich body (HTML / markdown produced by the admin editor).
  body: text("body").notNull().default(""),
  coverImageUrl: text("cover_image_url"),
  // Modern responsive variants generated at upload time (image SEO + CWV).
  coverImageWebpUrl: text("cover_image_webp_url"),
  coverImageAvifUrl: text("cover_image_avif_url"),
  coverImageWidth: integer("cover_image_width"),
  coverImageHeight: integer("cover_image_height"),
  coverImageAlt: text("cover_image_alt"),
  // Comma-separated tags for lightweight topical grouping.
  tags: text("tags").notNull().default(""),
  // Optional related city for the city-page "latest articles" slot.
  cityId: integer("city_id"),
  // ─── Meta (French SEO) ──────────────────────────────────────────────────────
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  // Author (FK to users); kept nullable so deleting a user doesn't orphan-delete.
  authorId: integer("author_id"),
  status: articleStatusEnum("status").notNull().default("draft"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertArticleSchema = createInsertSchema(articlesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articlesTable.$inferSelect;
