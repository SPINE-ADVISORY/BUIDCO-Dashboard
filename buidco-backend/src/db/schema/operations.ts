import {
  pgTable, serial, integer, varchar, boolean, date, text, timestamp,
} from "drizzle-orm/pg-core";
import { project } from "./core";

export const clearanceNoc = pgTable("clearance_noc", {
  clearanceId:       serial("clearance_id").primaryKey(),
  projectId:         integer("project_id").references(() => project.projectId),
  clearanceType:     varchar("clearance_type", { length: 80 }).notNull(),
  deptResponsible:   varchar("dept_responsible", { length: 100 }).notNull(),
  responsibleOfficer:varchar("responsible_officer", { length: 120 }),
  contactPhone:      varchar("contact_phone", { length: 15 }),
  appliedDate:       date("applied_date"),
  status:            varchar("status", { length: 20 }),
  receivedDate:      date("received_date"),
  // Generated: pending_days, dc_escalation_needed
  pendingDays:            integer("pending_days"),
  isBlockingWork:         boolean("is_blocking_work").default(true),
  dcEscalationNeeded:     boolean("dc_escalation_needed"),
  remarks:                text("remarks"),
});

export const qualityTest = pgTable("quality_test", {
  testId:        serial("test_id").primaryKey(),
  projectId:     integer("project_id").references(() => project.projectId),
  testDate:      date("test_date").notNull(),
  componentName: varchar("component_name", { length: 150 }).notNull(),
  testType:      varchar("test_type", { length: 80 }).notNull(),
  specification: varchar("specification", { length: 100 }),
  actualValue:   varchar("actual_value", { length: 80 }),
  labName:       varchar("lab_name", { length: 150 }),
  result:        varchar("result", { length: 15 }),
  passFail:      boolean("pass_fail"),
  remarks:       text("remarks"),
});

export const projectFlag = pgTable("project_flag", {
  flagId:             serial("flag_id").primaryKey(),
  projectId:          integer("project_id").references(() => project.projectId),
  flagDate:           date("flag_date").defaultNow(),
  severity:           varchar("severity", { length: 10 }),
  flagStatus:         varchar("flag_status", { length: 15 }),
  flagCategory:       varchar("flag_category", { length: 80 }),
  flagDescription:    text("flag_description").notNull(),
  actionRequired:     text("action_required").notNull(),
  responsibleDept:    varchar("responsible_dept", { length: 100 }).notNull(),
  responsibleOfficer: varchar("responsible_officer", { length: 120 }),
  contactPhone:       varchar("contact_phone", { length: 15 }),
  deadlineDate:       date("deadline_date"),
  // Generated: days_open = CURRENT_DATE - flag_date
  daysOpen:           integer("days_open"),
  isDcFlag:           boolean("is_dc_flag").default(false),
  isMdFlag:           boolean("is_md_flag").default(false),
  resolvedDate:       date("resolved_date"),
  resolvedBy:         varchar("resolved_by", { length: 80 }),
  resolutionNotes:    text("resolution_notes"),
  createdBy:          varchar("created_by", { length: 80 }).notNull(),
  createdAt:          timestamp("created_at").defaultNow(),
  isPreMonsoon:       boolean("is_pre_monsoon").default(false),
});
