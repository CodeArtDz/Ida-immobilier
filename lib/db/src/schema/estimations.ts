import { pgTable, serial, text, integer, boolean, numeric, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const estimationStatusEnum = pgEnum("estimation_status", ["pending", "in_progress", "completed"]);
export const estimationPropertyTypeEnum = pgEnum("estimation_property_type", ["apartment", "house", "villa", "land", "commercial", "other"]);

export const estimationsTable = pgTable("estimations", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  postalCode: text("postal_code").notNull(),
  propertyType: estimationPropertyTypeEnum("property_type").notNull(),
  livingArea: real("living_area"),
  rooms: integer("rooms"),
  bedrooms: integer("bedrooms"),
  condition: text("condition"),
  hasParking: boolean("has_parking").notNull().default(false),
  hasGarden: boolean("has_garden").notNull().default(false),
  hasPool: boolean("has_pool").notNull().default(false),
  additionalInfo: text("additional_info"),
  status: estimationStatusEnum("status").notNull().default("pending"),
  estimatedMinPrice: numeric("estimated_min_price", { precision: 12, scale: 2 }),
  estimatedMaxPrice: numeric("estimated_max_price", { precision: 12, scale: 2 }),
  agentNotes: text("agent_notes"),
  assignedAgentId: integer("assigned_agent_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertEstimationSchema = createInsertSchema(estimationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEstimation = z.infer<typeof insertEstimationSchema>;
export type Estimation = typeof estimationsTable.$inferSelect;
