import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mediaTypeEnum = pgEnum("media_type", ["photo", "video", "floor_plan", "pdf"]);

export const propertyMediaTable = pgTable("property_media", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  url: text("url").notNull(),
  watermarkedUrl: text("watermarked_url"),
  // Modern responsive variants generated at upload time for image SEO / Core
  // Web Vitals. Null on legacy rows uploaded before the pipeline existed.
  webpUrl: text("webp_url"),
  avifUrl: text("avif_url"),
  // Descriptive alt text (SEO + accessibility) and intrinsic dimensions for
  // <img width/height> to avoid layout shift.
  alt: text("alt"),
  width: integer("width"),
  height: integer("height"),
  type: mediaTypeEnum("type").notNull().default("photo"),
  caption: text("caption"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPropertyMediaSchema = createInsertSchema(propertyMediaTable).omit({ id: true, createdAt: true });
export type InsertPropertyMedia = z.infer<typeof insertPropertyMediaSchema>;
export type PropertyMedia = typeof propertyMediaTable.$inferSelect;
