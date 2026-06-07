import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadSourceEnum = pgEnum("lead_source", ["property_inquiry", "estimation_request", "contact_form", "manual"]);
export const leadStatusEnum = pgEnum("lead_status", ["new", "contacted", "qualified", "lost", "won"]);

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  source: leadSourceEnum("source").notNull(),
  status: leadStatusEnum("status").notNull().default("new"),
  message: text("message"),
  notes: text("notes"),
  propertyId: integer("property_id"),
  assignedAgentId: integer("assigned_agent_id"),
  agencyId: integer("agency_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;
