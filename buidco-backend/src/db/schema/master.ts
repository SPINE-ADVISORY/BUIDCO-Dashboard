import {
  pgTable, serial, varchar, numeric, boolean, timestamp,
} from "drizzle-orm/pg-core";

export const sector = pgTable("sector", {
  sectorId:   serial("sector_id").primaryKey(),
  sectorCode: varchar("sector_code", { length: 20 }).unique().notNull(),
  sectorName: varchar("sector_name", { length: 100 }).notNull(),
  sectorIcon: varchar("sector_icon", { length: 10 }),
  createdAt:  timestamp("created_at").defaultNow(),
  updatedAt:  timestamp("updated_at").defaultNow(),
});

export const ulb = pgTable("ulb", {
  ulbId:          serial("ulb_id").primaryKey(),
  ulbCode:        varchar("ulb_code", { length: 10 }).unique().notNull(),
  ulbName:        varchar("ulb_name", { length: 120 }).notNull(),
  ulbType:        varchar("ulb_type", { length: 30 }),
  districtName:   varchar("district_name", { length: 80 }).notNull(),
  districtCode:   varchar("district_code", { length: 10 }),
  division:       varchar("division", { length: 80 }),
  populationLakh: numeric("population_lakh", { precision: 6, scale: 2 }),
  createdAt:      timestamp("created_at").defaultNow(),
  updatedAt:      timestamp("updated_at").defaultNow(),
});

export const vendor = pgTable("vendor", {
  vendorId:          serial("vendor_id").primaryKey(),
  vendorCode:        varchar("vendor_code", { length: 20 }).unique(),
  vendorType:        varchar("vendor_type", { length: 20 }),
  contractorName:    varchar("contractor_name", { length: 200 }).notNull(),
  companyName:       varchar("company_name", { length: 200 }),
  pan:               varchar("pan", { length: 10 }),
  gstin:             varchar("gstin", { length: 15 }),
  phoneNumber:       varchar("phone_number", { length: 15 }).notNull(),
  emailId:           varchar("email_id", { length: 100 }),
  isBlacklisted:     boolean("is_blacklisted").default(false),
  blacklistReason:   varchar("blacklist_reason", { length: 500 }),
  performanceRating: numeric("performance_rating", { precision: 2, scale: 0 }),
  createdAt:         timestamp("created_at").defaultNow(),
  updatedAt:         timestamp("updated_at").defaultNow(),
});

export const fundingScheme = pgTable("funding_scheme", {
  schemeId:      serial("scheme_id").primaryKey(),
  schemeCode:    varchar("scheme_code", { length: 20 }).unique().notNull(),
  schemeName:    varchar("scheme_name", { length: 200 }).notNull(),
  fundSource:    varchar("fund_source", { length: 30 }),
  nodalMinistry: varchar("nodal_ministry", { length: 150 }),
  startFy:       varchar("start_fy", { length: 7 }),
  endFy:         varchar("end_fy", { length: 7 }),
  isActive:      boolean("is_active").default(true),
});

export const department = pgTable("department", {
  deptId:       serial("dept_id").primaryKey(),
  deptCode:     varchar("dept_code", { length: 20 }).unique().notNull(),
  deptName:     varchar("dept_name", { length: 150 }).notNull(),
  deptType:     varchar("dept_type", { length: 30 }),
  nodalOfficer: varchar("nodal_officer", { length: 120 }),
  contactPhone: varchar("contact_phone", { length: 15 }),
  contactEmail: varchar("contact_email", { length: 100 }),
});
