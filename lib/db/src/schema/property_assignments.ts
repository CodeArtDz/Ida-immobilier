import { pgTable, serial, integer, text, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const propertyAssignmentsTable = pgTable("property_assignments", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  ownerAgentId: integer("owner_agent_id").notNull(),
  temporaryAgentId: integer("temporary_agent_id").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPropertyAssignmentSchema = createInsertSchema(propertyAssignmentsTable).omit({ id: true, createdAt: true });
export type InsertPropertyAssignment = z.infer<typeof insertPropertyAssignmentSchema>;
export type PropertyAssignment = typeof propertyAssignmentsTable.$inferSelect;
