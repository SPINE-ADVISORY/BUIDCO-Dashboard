import {
  pgTable, serial, integer, varchar, numeric, boolean, date, text, timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { project } from "./core";
import { projectMilestone } from "./core";

export const progress = pgTable("progress", {
  progressId:                   serial("progress_id").primaryKey(),
  projectId:                    integer("project_id").references(() => project.projectId),
  snapMonth:                    date("snap_month").notNull(),
  paymentsReleasedGoiState:     numeric("payments_released_goi_state", { precision: 14, scale: 2 }),
  paymentsReleasedToContractor: numeric("payments_released_to_contractor", { precision: 14, scale: 2 }),
  scheduledFinancialPct:        numeric("scheduled_financial_pct", { precision: 5, scale: 2 }).notNull(),
  actualFinancialPct:           numeric("actual_financial_pct", { precision: 5, scale: 2 }),
  scheduledPhysicalPct:         numeric("scheduled_physical_pct", { precision: 5, scale: 2 }).notNull(),
  actualPhysicalPct:            numeric("actual_physical_pct", { precision: 5, scale: 2 }),
  // Generated: physical_deviation, financial_deviation, physical_status
  physicalDeviation:            numeric("physical_deviation", { precision: 5, scale: 2 }),
  financialDeviation:           numeric("financial_deviation", { precision: 5, scale: 2 }),
  paymentStatus:                varchar("payment_status", { length: 20 }),
  physicalStatus:               varchar("physical_status", { length: 20 }),
  delayReason:                  varchar("delay_reason", { length: 50 }),
  delayDetails:                 text("delay_details"),
  workDoneThisMonth:            text("work_done_this_month"),
  submittedBy:                  varchar("submitted_by", { length: 80 }).notNull(),
  createdAt:                    timestamp("created_at").defaultNow(),
  updatedAt:                    timestamp("updated_at").defaultNow(),
}, (t) => [unique().on(t.projectId, t.snapMonth)]);

export const milestoneProgress = pgTable("milestone_progress", {
  mpId:                serial("mp_id").primaryKey(),
  milestoneId:         integer("milestone_id").references(() => projectMilestone.milestoneId),
  projectId:           integer("project_id").references(() => project.projectId),
  snapMonth:           date("snap_month").notNull(),
  progressPct:         numeric("progress_pct", { precision: 5, scale: 2 }).notNull(),
  weightedContribution:numeric("weighted_contribution", { precision: 6, scale: 3 }),
  createdAt:           timestamp("created_at").defaultNow(),
}, (t) => [unique().on(t.milestoneId, t.snapMonth)]);
