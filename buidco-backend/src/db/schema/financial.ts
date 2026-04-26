import {
  pgTable, serial, integer, varchar, numeric, boolean, date, text,
} from "drizzle-orm/pg-core";
import { project } from "./core";
import { vendor } from "./master";

export const fundRelease = pgTable("fund_release", {
  releaseId:     serial("release_id").primaryKey(),
  projectId:     integer("project_id").references(() => project.projectId),
  releaseDate:   date("release_date").notNull(),
  releaseLevel:  varchar("release_level", { length: 20 }),
  releaseAmount: numeric("release_amount", { precision: 14, scale: 2 }).notNull(),
  ucSubmitted:   boolean("uc_submitted").default(false),
  ucDate:        date("uc_date"),
  // Generated: uc_pending_days
  ucPendingDays: integer("uc_pending_days"),
  remarks:       text("remarks"),
});

export const contractorBill = pgTable("contractor_bill", {
  billId:        serial("bill_id").primaryKey(),
  projectId:     integer("project_id").references(() => project.projectId),
  vendorId:      integer("vendor_id").references(() => vendor.vendorId),
  billNo:        varchar("bill_no", { length: 50 }).notNull(),
  billDate:      date("bill_date").notNull(),
  billType:      varchar("bill_type", { length: 20 }),
  grossAmount:   numeric("gross_amount", { precision: 14, scale: 2 }).notNull(),
  deductions:    numeric("deductions", { precision: 14, scale: 2 }).default("0"),
  // Generated: net_payable = gross_amount - deductions
  netPayable:    numeric("net_payable", { precision: 14, scale: 2 }),
  paymentStatus: varchar("payment_status", { length: 20 }),
  approvedDate:  date("approved_date"),
  paymentDate:   date("payment_date"),
  // Generated: pending_days
  pendingDays:   integer("pending_days"),
  // Generated: escalation_flag
  escalationFlag:boolean("escalation_flag"),
  remarks:       text("remarks"),
});

export const securityInstrument = pgTable("security_instrument", {
  instrumentId:   serial("instrument_id").primaryKey(),
  projectId:      integer("project_id").references(() => project.projectId),
  vendorId:       integer("vendor_id").references(() => vendor.vendorId),
  instrumentType: varchar("instrument_type", { length: 20 }),
  bankName:       varchar("bank_name", { length: 100 }),
  bgNumber:       varchar("bg_number", { length: 80 }),
  amount:         numeric("amount", { precision: 14, scale: 2 }).notNull(),
  issueDate:      date("issue_date").notNull(),
  expiryDate:     date("expiry_date").notNull(),
  // Generated: days_to_expiry, expiry_alert
  daysToExpiry:   integer("days_to_expiry"),
  expiryAlert:    varchar("expiry_alert", { length: 30 }),
  isExtended:     boolean("is_extended").default(false),
  isEncashed:     boolean("is_encashed").default(false),
  remarks:        text("remarks"),
});
