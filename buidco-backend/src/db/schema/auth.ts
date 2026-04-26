import {
  pgTable, serial, varchar, boolean, timestamp, integer, text,
} from "drizzle-orm/pg-core";

export const appUser = pgTable("app_user", {
  userId:      serial("user_id").primaryKey(),
  username:    varchar("username", { length: 80 }).unique().notNull(),
  fullName:    varchar("full_name", { length: 150 }).notNull(),
  designation: varchar("designation", { length: 100 }),
  role:        varchar("role", { length: 20 }),
  ulbScope:    text("ulb_scope"),
  sectorScope: text("sector_scope"),
  email:       varchar("email", { length: 120 }),
  phone:       varchar("phone", { length: 15 }),
  isActive:    boolean("is_active").default(true),
  lastLogin:   timestamp("last_login"),
});

export const rolePermission = pgTable("role_permission", {
  role:       varchar("role", { length: 20 }).primaryKey(),
  canViewAll: boolean("can_view_all").default(true),
  canEdit:    boolean("can_edit").default(false),
  canAdd:     boolean("can_add").default(false),
  description: text("description"),
});

export const projectAuditLog = pgTable("project_audit_log", {
  auditId:    serial("audit_id").primaryKey(),
  projectId:  integer("project_id"),
  changedBy:  integer("changed_by"),
  changedAt:  timestamp("changed_at").defaultNow(),
  fieldName:  varchar("field_name", { length: 80 }).notNull(),
  oldValue:   text("old_value"),
  newValue:   text("new_value"),
  changeType: varchar("change_type", { length: 20 }),
});
