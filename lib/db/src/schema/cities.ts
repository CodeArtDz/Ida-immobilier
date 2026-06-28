import { pgTable, serial, text, real, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// City registry powering the programmatic SEO pages (/immobilier-{slug},
// /agence-immobiliere-{slug}, /estimation-immobiliere-{slug}, type×city, postal).
// One row per served commune around Marignane / Provence.
export const citiesTable = pgTable("cities", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  // Comma-separated list of postal codes served (e.g. "13700"). Stored as text
  // for portability; helpers split on commas.
  postalCodes: text("postal_codes").notNull().default(""),
  department: text("department").notNull().default("Bouches-du-Rhône"),
  departmentCode: text("department_code").notNull().default("13"),
  region: text("region").notNull().default("Provence-Alpes-Côte d'Azur"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  population: integer("population"),
  // Comma-separated slugs of nearby cities (within ~70km) for internal linking.
  nearbyCitySlugs: text("nearby_city_slugs").notNull().default(""),
  // ─── SEO content blocks (French) ──────────────────────────────────────────
  intro: text("intro"),
  marketContext: text("market_context"),
  livingThere: text("living_there"),
  buyingAdvice: text("buying_advice"),
  sellingAdvice: text("selling_advice"),
  // ─── Meta ─────────────────────────────────────────────────────────────────
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  heroImageUrl: text("hero_image_url"),
  displayOrder: integer("display_order").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCitySchema = createInsertSchema(citiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCity = z.infer<typeof insertCitySchema>;
export type City = typeof citiesTable.$inferSelect;
