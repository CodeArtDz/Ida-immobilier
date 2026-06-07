import { pgTable, serial, text, integer, boolean, numeric, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const savedSearchesTable = pgTable("saved_searches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type"),
  city: text("city"),
  minPrice: numeric("min_price", { precision: 12, scale: 2 }),
  maxPrice: numeric("max_price", { precision: 12, scale: 2 }),
  minArea: real("min_area"),
  maxArea: real("max_area"),
  rooms: integer("rooms"),
  bedrooms: integer("bedrooms"),
  alertEnabled: boolean("alert_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSavedSearchSchema = createInsertSchema(savedSearchesTable).omit({ id: true, createdAt: true });
export type InsertSavedSearch = z.infer<typeof insertSavedSearchSchema>;
export type SavedSearch = typeof savedSearchesTable.$inferSelect;
