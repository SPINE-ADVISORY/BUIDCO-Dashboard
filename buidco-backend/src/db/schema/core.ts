import {
  pgTable, serial, varchar, numeric, boolean, timestamp,
  integer, date, text,
} from "drizzle-orm/pg-core";
import { sector, ulb, vendor, fundingScheme } from "./master";

export const project = pgTable("project", {
  projectId:            serial("project_id").primaryKey(),
  projectCode:          varchar("project_code", { length: 30 }).unique().notNull(),
  projectName:          varchar("project_name", { length: 300 }).notNull(),
  sectorId:             integer("sector_id").references(() => sector.sectorId),
  ulbId:                integer("ulb_id").references(() => ulb.ulbId),
  districtId:           integer("district_id"),
  schemeId:             integer("scheme_id").references(() => fundingScheme.schemeId),
  procurementMode:      varchar("procurement_mode", { length: 10 }),
  contractorId:         integer("contractor_id").references(() => vendor.vendorId),
  consultantId:         integer("consultant_id").references(() => vendor.vendorId),
  status:               varchar("status", { length: 20 }),
  phase:                varchar("phase", { length: 50 }),
  scheduledStartDate:   date("scheduled_start_date").notNull(),
  actualStartDate:      date("actual_start_date"),
  plannedEndDate:       date("planned_end_date").notNull(),
  revisedEndDate:       date("revised_end_date"),
  actualEndDate:        date("actual_end_date"),
  totalCosCount:        integer("total_cos_count").default(0),
  totalEotDays:         integer("total_eot_days").default(0),
  // delay_days is GENERATED ALWAYS AS in DB — expose as nullable int in schema
  delayDays:            integer("delay_days"),
  isDelayed:            boolean("is_delayed"),
  dcAttentionFlag:      boolean("dc_attention_flag").default(false),
  // Extra identity fields added for frontend CRUD
  agreementNumber:      varchar("agreement_number", { length: 80 }),
  agreementDate:        date("agreement_date"),
  appointedDate:        date("appointed_date"),
  latitude:             numeric("latitude", { precision: 10, scale: 6 }),
  longitude:            numeric("longitude", { precision: 10, scale: 6 }),
  chainage:             varchar("chainage", { length: 100 }),
  deptStuck:            varchar("dept_stuck", { length: 100 }),
  delayReason:          varchar("delay_reason", { length: 50 }),
  statusOnCommencement: varchar("status_on_commencement", { length: 50 }),
  createdAt:            timestamp("created_at").defaultNow(),
  updatedAt:            timestamp("updated_at").defaultNow(),
});

export const projectCost = pgTable("project_cost", {
  costId:               serial("cost_id").primaryKey(),
  projectId:            integer("project_id").unique().references(() => project.projectId),
  sanctionedCost:       numeric("sanctioned_cost", { precision: 14, scale: 2 }).notNull(),
  revisedCost1:         numeric("revised_cost_1", { precision: 14, scale: 2 }),
  revisedCost1Date:     date("revised_cost_1_date"),
  revisedCost1Reason:   varchar("revised_cost_1_reason", { length: 200 }),
  revisedCost2:         numeric("revised_cost_2", { precision: 14, scale: 2 }),
  revisedCost2Date:     date("revised_cost_2_date"),
  currentSanctionedCost:numeric("current_sanctioned_cost", { precision: 14, scale: 2 }),
  totalExpenditure:     numeric("total_expenditure", { precision: 14, scale: 2 }).default("0"),
  // Generated columns — read-only, not writable via ORM
  financialProgressPct: numeric("financial_progress_pct", { precision: 5, scale: 2 }),
  balanceToSpend:       numeric("balance_to_spend", { precision: 14, scale: 2 }),
  // Additional financial fields from frontend forms
  contractValueLakhs:              numeric("contract_value_lakhs", { precision: 14, scale: 2 }),
  mobilizationAdvanceLakhs:        numeric("mobilization_advance_lakhs", { precision: 14, scale: 2 }),
  mobilizationAdvanceRecoveredLakhs: numeric("mobilization_advance_recovered_lakhs", { precision: 14, scale: 2 }),
  paymentsLakhs:                   numeric("payments_made_lakhs", { precision: 14, scale: 2 }),
  lastPaymentDate:                 date("last_payment_date"),
  lastRaBillNo:                    varchar("last_ra_bill_no", { length: 80 }),
  retentionMoneyLakhs:             numeric("retention_money_lakhs", { precision: 14, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectMilestone = pgTable("project_milestone", {
  milestoneId:   serial("milestone_id").primaryKey(),
  projectId:     integer("project_id").references(() => project.projectId),
  milestoneName: varchar("milestone_name", { length: 200 }).notNull(),
  weightPct:     numeric("weight_pct", { precision: 5, scale: 2 }).notNull(),
  appointedDate: date("appointed_date"),
  plannedDate:   date("planned_date").notNull(),
  actualDate:    date("actual_date"),
  milestoneDelayDays: integer("milestone_delay_days"),
  createdAt:     timestamp("created_at").defaultNow(),
  updatedAt:     timestamp("updated_at").defaultNow(),
});
