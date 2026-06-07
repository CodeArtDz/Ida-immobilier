import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mediaTypeEnum = pgEnum("media_type", ["photo", "video", "floor_plan", "pdf"]);

export const propertyMediaTable = pgTable("property_media", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  url: text("url").notNull(),
  watermarkedUrl: text("watermarked_url"),
  type: mediaTypeEnum("type").notNull().default("photo"),
  caption: text("caption"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPropertyMediaSchema = createInsertSchema(propertyMediaTable).omit({ id: true, createdAt: true });
export type InsertPropertyMedia = z.infer<typeof insertPropertyMediaSchema>;
export type PropertyMedia = typeof propertyMediaTable.$inferSelect;
