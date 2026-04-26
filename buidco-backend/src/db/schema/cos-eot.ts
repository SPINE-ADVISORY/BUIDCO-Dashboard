import {
  pgTable, serial, integer, varchar, numeric, boolean, timestamp, date, text,
} from "drizzle-orm/pg-core";
import { project } from "./core";

export const changeOfScope = pgTable("change_of_scope", {
  cosId:             serial("cos_id").primaryKey(),
  projectId:         integer("project_id").notNull().references(() => project.projectId),
  cosNumber:         varchar("cos_number", { length: 20 }).notNull(),
  cosDate:           date("cos_date").notNull(),
  cosCategory:       varchar("cos_category", { length: 50 }).notNull(),
  cosDescription:    text("cos_description").notNull(),
  costBeforeCos:     numeric("cost_before_cos", { precision: 14, scale: 2 }).notNull(),
  cosAmount:         numeric("cos_amount", { precision: 14, scale: 2 }).notNull(),
  // Generated: cost_after_cos = cost_before_cos + cos_amount
  costAfterCos:      numeric("cost_after_cos", { precision: 14, scale: 2 }),
  // Generated: cos_pct_variation
  cosPctVariation:   numeric("cos_pct_variation", { precision: 6, scale: 2 }),
  approvalAuthority: varchar("approval_authority", { length: 100 }).notNull(),
  approvalOrderNo:   varchar("approval_order_no", { length: 80 }).notNull(),
  isTimeLinked:      boolean("is_time_linked").default(false),
  remarks:           text("remarks"),
  createdAt:         timestamp("created_at").defaultNow(),
  updatedAt:         timestamp("updated_at").defaultNow(),
});

export const extensionOfTime = pgTable("extension_of_time", {
  eotId:             serial("eot_id").primaryKey(),
  projectId:         integer("project_id").notNull().references(() => project.projectId),
  cosId:             integer("cos_id").references(() => changeOfScope.cosId),
  clearanceId:       integer("clearance_id"),
  eotNumber:         varchar("eot_number", { length: 20 }).notNull(),
  eotCategory:       varchar("eot_category", { length: 50 }).notNull(),
  eotReason:         text("eot_reason").notNull(),
  eotDaysSought:     integer("eot_days_sought").notNull(),
  eotDaysGranted:    integer("eot_days_granted").notNull(),
  dateFrom:          date("date_from").notNull(),
  // Generated: revised_end_date = date_from + eot_days_granted
  revisedEndDate:    date("revised_end_date"),
  approvalAuthority: varchar("approval_authority", { length: 100 }).notNull(),
  approvalOrderNo:   varchar("approval_order_no", { length: 80 }).notNull(),
  eotApprovalDate:   date("eot_approval_date").notNull(),
  isFinal:           boolean("is_final").default(false),
  remarks:           text("remarks"),
  createdAt:         timestamp("created_at").defaultNow(),
  updatedAt:         timestamp("updated_at").defaultNow(),
});

export const revisedDateLog = pgTable("revised_date_log", {
  revisionId:       serial("revision_id").primaryKey(),
  projectId:        integer("project_id").notNull().references(() => project.projectId),
  revisionNumber:   integer("revision_number").notNull(),
  eotId:            integer("eot_id").references(() => extensionOfTime.eotId),
  cosId:            integer("cos_id").references(() => changeOfScope.cosId),
  previousEndDate:  date("previous_end_date").notNull(),
  newEndDate:       date("new_end_date").notNull(),
  // Generated: days_extended = new_end_date - previous_end_date
  daysExtended:     integer("days_extended"),
  revisionReason:   varchar("revision_reason", { length: 50 }),
  revisionDate:     date("revision_date").notNull(),
  approvalAuthority:varchar("approval_authority", { length: 100 }).notNull(),
  approvalOrderNo:  varchar("approval_order_no", { length: 80 }).notNull(),
  isCurrent:        boolean("is_current").default(false),
  remarks:          text("remarks"),
  createdAt:        timestamp("created_at").defaultNow(),
});
