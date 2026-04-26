CREATE TABLE IF NOT EXISTS "app_user" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"username" varchar(80) NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"designation" varchar(100),
	"role" varchar(20),
	"ulb_scope" text,
	"sector_scope" text,
	"email" varchar(120),
	"phone" varchar(15),
	"is_active" boolean DEFAULT true,
	"last_login" timestamp,
	CONSTRAINT "app_user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_audit_log" (
	"audit_id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"changed_by" integer,
	"changed_at" timestamp DEFAULT now(),
	"field_name" varchar(80) NOT NULL,
	"old_value" text,
	"new_value" text,
	"change_type" varchar(20)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "role_permission" (
	"role" varchar(20) PRIMARY KEY NOT NULL,
	"can_view_all" boolean DEFAULT true,
	"can_edit" boolean DEFAULT false,
	"can_add" boolean DEFAULT false,
	"description" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project" (
	"project_id" serial PRIMARY KEY NOT NULL,
	"project_code" varchar(30) NOT NULL,
	"project_name" varchar(300) NOT NULL,
	"sector_id" integer,
	"ulb_id" integer,
	"district_id" integer,
	"scheme_id" integer,
	"procurement_mode" varchar(10),
	"contractor_id" integer,
	"consultant_id" integer,
	"status" varchar(20),
	"phase" varchar(50),
	"scheduled_start_date" date NOT NULL,
	"actual_start_date" date,
	"planned_end_date" date NOT NULL,
	"revised_end_date" date,
	"actual_end_date" date,
	"total_cos_count" integer DEFAULT 0,
	"total_eot_days" integer DEFAULT 0,
	"delay_days" integer,
	"is_delayed" boolean,
	"dc_attention_flag" boolean DEFAULT false,
	"agreement_number" varchar(80),
	"agreement_date" date,
	"appointed_date" date,
	"latitude" numeric(10, 6),
	"longitude" numeric(10, 6),
	"chainage" varchar(100),
	"dept_stuck" varchar(100),
	"delay_reason" varchar(50),
	"status_on_commencement" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "project_project_code_unique" UNIQUE("project_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_cost" (
	"cost_id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"sanctioned_cost" numeric(14, 2) NOT NULL,
	"revised_cost_1" numeric(14, 2),
	"revised_cost_1_date" date,
	"revised_cost_1_reason" varchar(200),
	"revised_cost_2" numeric(14, 2),
	"revised_cost_2_date" date,
	"current_sanctioned_cost" numeric(14, 2),
	"total_expenditure" numeric(14, 2) DEFAULT '0',
	"financial_progress_pct" numeric(5, 2),
	"balance_to_spend" numeric(14, 2),
	"contract_value_lakhs" numeric(14, 2),
	"mobilization_advance_lakhs" numeric(14, 2),
	"mobilization_advance_recovered_lakhs" numeric(14, 2),
	"payments_made_lakhs" numeric(14, 2),
	"last_payment_date" date,
	"last_ra_bill_no" varchar(80),
	"retention_money_lakhs" numeric(14, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "project_cost_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_milestone" (
	"milestone_id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"milestone_name" varchar(200) NOT NULL,
	"weight_pct" numeric(5, 2) NOT NULL,
	"appointed_date" date,
	"planned_date" date NOT NULL,
	"actual_date" date,
	"milestone_delay_days" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "change_of_scope" (
	"cos_id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"cos_number" varchar(20) NOT NULL,
	"cos_date" date NOT NULL,
	"cos_category" varchar(50) NOT NULL,
	"cos_description" text NOT NULL,
	"cost_before_cos" numeric(14, 2) NOT NULL,
	"cos_amount" numeric(14, 2) NOT NULL,
	"cost_after_cos" numeric(14, 2),
	"cos_pct_variation" numeric(6, 2),
	"approval_authority" varchar(100) NOT NULL,
	"approval_order_no" varchar(80) NOT NULL,
	"is_time_linked" boolean DEFAULT false,
	"remarks" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "extension_of_time" (
	"eot_id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"cos_id" integer,
	"clearance_id" integer,
	"eot_number" varchar(20) NOT NULL,
	"eot_category" varchar(50) NOT NULL,
	"eot_reason" text NOT NULL,
	"eot_days_sought" integer NOT NULL,
	"eot_days_granted" integer NOT NULL,
	"date_from" date NOT NULL,
	"revised_end_date" date,
	"approval_authority" varchar(100) NOT NULL,
	"approval_order_no" varchar(80) NOT NULL,
	"eot_approval_date" date NOT NULL,
	"is_final" boolean DEFAULT false,
	"remarks" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "revised_date_log" (
	"revision_id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"revision_number" integer NOT NULL,
	"eot_id" integer,
	"cos_id" integer,
	"previous_end_date" date NOT NULL,
	"new_end_date" date NOT NULL,
	"days_extended" integer,
	"revision_reason" varchar(50),
	"revision_date" date NOT NULL,
	"approval_authority" varchar(100) NOT NULL,
	"approval_order_no" varchar(80) NOT NULL,
	"is_current" boolean DEFAULT false,
	"remarks" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contractor_bill" (
	"bill_id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"vendor_id" integer,
	"bill_no" varchar(50) NOT NULL,
	"bill_date" date NOT NULL,
	"bill_type" varchar(20),
	"gross_amount" numeric(14, 2) NOT NULL,
	"deductions" numeric(14, 2) DEFAULT '0',
	"net_payable" numeric(14, 2),
	"payment_status" varchar(20),
	"approved_date" date,
	"payment_date" date,
	"pending_days" integer,
	"escalation_flag" boolean,
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fund_release" (
	"release_id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"release_date" date NOT NULL,
	"release_level" varchar(20),
	"release_amount" numeric(14, 2) NOT NULL,
	"uc_submitted" boolean DEFAULT false,
	"uc_date" date,
	"uc_pending_days" integer,
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "security_instrument" (
	"instrument_id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"vendor_id" integer,
	"instrument_type" varchar(20),
	"bank_name" varchar(100),
	"bg_number" varchar(80),
	"amount" numeric(14, 2) NOT NULL,
	"issue_date" date NOT NULL,
	"expiry_date" date NOT NULL,
	"days_to_expiry" integer,
	"expiry_alert" varchar(30),
	"is_extended" boolean DEFAULT false,
	"is_encashed" boolean DEFAULT false,
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "department" (
	"dept_id" serial PRIMARY KEY NOT NULL,
	"dept_code" varchar(20) NOT NULL,
	"dept_name" varchar(150) NOT NULL,
	"dept_type" varchar(30),
	"nodal_officer" varchar(120),
	"contact_phone" varchar(15),
	"contact_email" varchar(100),
	CONSTRAINT "department_dept_code_unique" UNIQUE("dept_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "funding_scheme" (
	"scheme_id" serial PRIMARY KEY NOT NULL,
	"scheme_code" varchar(20) NOT NULL,
	"scheme_name" varchar(200) NOT NULL,
	"fund_source" varchar(30),
	"nodal_ministry" varchar(150),
	"start_fy" varchar(7),
	"end_fy" varchar(7),
	"is_active" boolean DEFAULT true,
	CONSTRAINT "funding_scheme_scheme_code_unique" UNIQUE("scheme_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sector" (
	"sector_id" serial PRIMARY KEY NOT NULL,
	"sector_code" varchar(20) NOT NULL,
	"sector_name" varchar(100) NOT NULL,
	"sector_icon" varchar(10),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sector_sector_code_unique" UNIQUE("sector_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ulb" (
	"ulb_id" serial PRIMARY KEY NOT NULL,
	"ulb_code" varchar(10) NOT NULL,
	"ulb_name" varchar(120) NOT NULL,
	"ulb_type" varchar(30),
	"district_name" varchar(80) NOT NULL,
	"district_code" varchar(10),
	"division" varchar(80),
	"population_lakh" numeric(6, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ulb_ulb_code_unique" UNIQUE("ulb_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendor" (
	"vendor_id" serial PRIMARY KEY NOT NULL,
	"vendor_code" varchar(20),
	"vendor_type" varchar(20),
	"contractor_name" varchar(200) NOT NULL,
	"company_name" varchar(200),
	"pan" varchar(10),
	"gstin" varchar(15),
	"phone_number" varchar(15) NOT NULL,
	"email_id" varchar(100),
	"is_blacklisted" boolean DEFAULT false,
	"blacklist_reason" varchar(500),
	"performance_rating" numeric(2, 0),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "vendor_vendor_code_unique" UNIQUE("vendor_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clearance_noc" (
	"clearance_id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"clearance_type" varchar(80) NOT NULL,
	"dept_responsible" varchar(100) NOT NULL,
	"responsible_officer" varchar(120),
	"contact_phone" varchar(15),
	"applied_date" date,
	"status" varchar(20),
	"received_date" date,
	"pending_days" integer,
	"is_blocking_work" boolean DEFAULT true,
	"dc_escalation_needed" boolean,
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_flag" (
	"flag_id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"flag_date" date DEFAULT now(),
	"severity" varchar(10),
	"flag_status" varchar(15),
	"flag_category" varchar(80),
	"flag_description" text NOT NULL,
	"action_required" text NOT NULL,
	"responsible_dept" varchar(100) NOT NULL,
	"responsible_officer" varchar(120),
	"contact_phone" varchar(15),
	"deadline_date" date,
	"days_open" integer,
	"is_dc_flag" boolean DEFAULT false,
	"is_md_flag" boolean DEFAULT false,
	"resolved_date" date,
	"resolved_by" varchar(80),
	"resolution_notes" text,
	"created_by" varchar(80) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"is_pre_monsoon" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quality_test" (
	"test_id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"test_date" date NOT NULL,
	"component_name" varchar(150) NOT NULL,
	"test_type" varchar(80) NOT NULL,
	"specification" varchar(100),
	"actual_value" varchar(80),
	"lab_name" varchar(150),
	"result" varchar(15),
	"pass_fail" boolean,
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "milestone_progress" (
	"mp_id" serial PRIMARY KEY NOT NULL,
	"milestone_id" integer,
	"project_id" integer,
	"snap_month" date NOT NULL,
	"progress_pct" numeric(5, 2) NOT NULL,
	"weighted_contribution" numeric(6, 3),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "milestone_progress_milestone_id_snap_month_unique" UNIQUE("milestone_id","snap_month")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "progress" (
	"progress_id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"snap_month" date NOT NULL,
	"payments_released_goi_state" numeric(14, 2),
	"payments_released_to_contractor" numeric(14, 2),
	"scheduled_financial_pct" numeric(5, 2) NOT NULL,
	"actual_financial_pct" numeric(5, 2),
	"scheduled_physical_pct" numeric(5, 2) NOT NULL,
	"actual_physical_pct" numeric(5, 2),
	"physical_deviation" numeric(5, 2),
	"financial_deviation" numeric(5, 2),
	"payment_status" varchar(20),
	"physical_status" varchar(20),
	"delay_reason" varchar(50),
	"delay_details" text,
	"work_done_this_month" text,
	"submitted_by" varchar(80) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "progress_project_id_snap_month_unique" UNIQUE("project_id","snap_month")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project" ADD CONSTRAINT "project_sector_id_sector_sector_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sector"("sector_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project" ADD CONSTRAINT "project_ulb_id_ulb_ulb_id_fk" FOREIGN KEY ("ulb_id") REFERENCES "public"."ulb"("ulb_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project" ADD CONSTRAINT "project_scheme_id_funding_scheme_scheme_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."funding_scheme"("scheme_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project" ADD CONSTRAINT "project_contractor_id_vendor_vendor_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."vendor"("vendor_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project" ADD CONSTRAINT "project_consultant_id_vendor_vendor_id_fk" FOREIGN KEY ("consultant_id") REFERENCES "public"."vendor"("vendor_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_cost" ADD CONSTRAINT "project_cost_project_id_project_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_milestone" ADD CONSTRAINT "project_milestone_project_id_project_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "change_of_scope" ADD CONSTRAINT "change_of_scope_project_id_project_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "extension_of_time" ADD CONSTRAINT "extension_of_time_project_id_project_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "extension_of_time" ADD CONSTRAINT "extension_of_time_cos_id_change_of_scope_cos_id_fk" FOREIGN KEY ("cos_id") REFERENCES "public"."change_of_scope"("cos_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "revised_date_log" ADD CONSTRAINT "revised_date_log_project_id_project_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "revised_date_log" ADD CONSTRAINT "revised_date_log_eot_id_extension_of_time_eot_id_fk" FOREIGN KEY ("eot_id") REFERENCES "public"."extension_of_time"("eot_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "revised_date_log" ADD CONSTRAINT "revised_date_log_cos_id_change_of_scope_cos_id_fk" FOREIGN KEY ("cos_id") REFERENCES "public"."change_of_scope"("cos_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contractor_bill" ADD CONSTRAINT "contractor_bill_project_id_project_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contractor_bill" ADD CONSTRAINT "contractor_bill_vendor_id_vendor_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("vendor_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fund_release" ADD CONSTRAINT "fund_release_project_id_project_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "security_instrument" ADD CONSTRAINT "security_instrument_project_id_project_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "security_instrument" ADD CONSTRAINT "security_instrument_vendor_id_vendor_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("vendor_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clearance_noc" ADD CONSTRAINT "clearance_noc_project_id_project_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_flag" ADD CONSTRAINT "project_flag_project_id_project_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quality_test" ADD CONSTRAINT "quality_test_project_id_project_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "milestone_progress" ADD CONSTRAINT "milestone_progress_milestone_id_project_milestone_milestone_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."project_milestone"("milestone_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "milestone_progress" ADD CONSTRAINT "milestone_progress_project_id_project_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "progress" ADD CONSTRAINT "progress_project_id_project_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
