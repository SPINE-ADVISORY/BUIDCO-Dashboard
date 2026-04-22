/**
 * Partial Drizzle schema mirror for Studio / future typed queries.
 * Full DDL is applied via `drizzle/0000_buidco_schema.sql` (from Read.md).
 */
import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  timestamp,
  date,
  numeric,
  text,
} from "drizzle-orm/pg-core";

export const sector = pgTable("sector", {
  sectorId: serial("sector_id").primaryKey(),
  sectorCode: varchar("sector_code", { length: 20 }).notNull().unique(),
  sectorName: varchar("sector_name", { length: 100 }).notNull(),
  sectorIcon: varchar("sector_icon", { length: 5 }),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow(),
});

export const project = pgTable("project", {
  projectId: serial("project_id").primaryKey(),
  projectCode: varchar("project_code", { length: 30 }).notNull().unique(),
  projectName: varchar("project_name", { length: 300 }).notNull(),
  sectorId: integer("sector_id"),
  ulbId: integer("ulb_id"),
  districtId: integer("district_id"),
  schemeId: integer("scheme_id"),
  procurementMode: varchar("procurement_mode", { length: 10 }),
  contractorId: integer("contractor_id"),
  consultantId: integer("consultant_id"),
  status: varchar("status", { length: 20 }),
  scheduledStartDate: date("scheduled_start_date").notNull(),
  actualStartDate: date("actual_start_date"),
  plannedEndDate: date("planned_end_date").notNull(),
  revisedEndDate: date("revised_end_date"),
  actualEndDate: date("actual_end_date"),
  totalCosCount: integer("total_cos_count").default(0),
  totalEotDays: integer("total_eot_days").default(0),
  dcAttentionFlag: boolean("dc_attention_flag").default(false),
  statusOnCommencement: varchar("status_on_commencement", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow(),
});

export const projectCost = pgTable("project_cost", {
  costId: serial("cost_id").primaryKey(),
  projectId: integer("project_id").unique().references(() => project.projectId),
  sanctionedCost: numeric("sanctioned_cost", { precision: 14, scale: 2 }).notNull(),
  currentSanctionedCost: numeric("current_sanctioned_cost", { precision: 14, scale: 2 }),
  totalExpenditure: numeric("total_expenditure", { precision: 14, scale: 2 }).default("0"),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow(),
});

export const projectFlag = pgTable("project_flag", {
  flagId: serial("flag_id").primaryKey(),
  projectId: integer("project_id"),
  flagDate: date("flag_date").notNull(),
  severity: varchar("severity", { length: 10 }),
  flagStatus: varchar("flag_status", { length: 15 }),
  flagCategory: varchar("flag_category", { length: 80 }),
  flagDescription: text("flag_description").notNull(),
  actionRequired: text("action_required").notNull(),
  responsibleDept: varchar("responsible_dept", { length: 100 }).notNull(),
  isDcFlag: boolean("is_dc_flag").default(false),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow(),
});
