import { pgTable, serial, text, boolean, integer, numeric, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const propertyTypeEnum = pgEnum("property_type", ["apartment", "house", "villa", "land", "commercial", "garage", "other", "building", "programme"]);
export const propertyStatusEnum = pgEnum("property_status", ["draft", "published", "reserved", "sold", "rented", "archived"]);

export const propertiesTable = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug"),
  type: propertyTypeEnum("type").notNull(),
  status: propertyStatusEnum("status").notNull().default("draft"),
  // Location
  address: text("address").notNull(),
  postalCode: text("postal_code").notNull(),
  city: text("city").notNull(),
  department: text("department"),
  region: text("region"),
  country: text("country").notNull().default("France"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  // Pricing
  salePrice: numeric("sale_price", { precision: 12, scale: 2 }),
  rentalPrice: numeric("rental_price", { precision: 10, scale: 2 }),
  charges: numeric("charges", { precision: 10, scale: 2 }),
  agencyFees: numeric("agency_fees", { precision: 10, scale: 2 }),
  taxeFonciere: numeric("taxe_fonciere", { precision: 10, scale: 2 }),
  // Characteristics
  livingArea: real("living_area"),
  landArea: real("land_area"),
  carrezArea: real("carrez_area"),
  rooms: integer("rooms"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  floor: integer("floor"),
  totalFloors: integer("total_floors"),
  yearBuilt: integer("year_built"),
  orientation: text("orientation"),
  heating: text("heating"),
  // Energy
  dpeRating: text("dpe_rating"),
  gesRating: text("ges_rating"),
  annualEnergyCost: numeric("annual_energy_cost", { precision: 10, scale: 2 }),
  // Equipment
  hasTerrace: boolean("has_terrace").notNull().default(false),
  hasBalcony: boolean("has_balcony").notNull().default(false),
  hasGarage: boolean("has_garage").notNull().default(false),
  hasParking: boolean("has_parking").notNull().default(false),
  hasGarden: boolean("has_garden").notNull().default(false),
  hasPool: boolean("has_pool").notNull().default(false),
  hasCellar: boolean("has_cellar").notNull().default(false),
  hasElevator: boolean("has_elevator").notNull().default(false),
  hasAirConditioning: boolean("has_air_conditioning").notNull().default(false),
  hasFiber: boolean("has_fiber").notNull().default(false),
  hasFireplace: boolean("has_fireplace").notNull().default(false),
  // Extra characteristics
  toilets: integer("toilets"),
  residenceName: text("residence_name"),
  // Descriptions
  shortDescription: text("short_description"),
  fullDescription: text("full_description"),
  // SEO
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  // Relations
  agencyId: integer("agency_id").notNull(),
  ownerAgentId: integer("owner_agent_id").notNull(),
  currentAgentId: integer("current_agent_id"),
  // Stats
  viewCount: integer("view_count").notNull().default(0),
  favoriteCount: integer("favorite_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPropertySchema = createInsertSchema(propertiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof propertiesTable.$inferSelect;
