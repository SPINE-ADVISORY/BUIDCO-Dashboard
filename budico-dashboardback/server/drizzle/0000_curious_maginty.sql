CREATE TABLE "project" (
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
	"scheduled_start_date" date NOT NULL,
	"actual_start_date" date,
	"planned_end_date" date NOT NULL,
	"revised_end_date" date,
	"actual_end_date" date,
	"total_cos_count" integer DEFAULT 0,
	"total_eot_days" integer DEFAULT 0,
	"dc_attention_flag" boolean DEFAULT false,
	"status_on_commencement" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "project_project_code_unique" UNIQUE("project_code")
);
--> statement-breakpoint
CREATE TABLE "project_cost" (
	"cost_id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"sanctioned_cost" numeric(14, 2) NOT NULL,
	"current_sanctioned_cost" numeric(14, 2),
	"total_expenditure" numeric(14, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "project_cost_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "project_flag" (
	"flag_id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"flag_date" date NOT NULL,
	"severity" varchar(10),
	"flag_status" varchar(15),
	"flag_category" varchar(80),
	"flag_description" text NOT NULL,
	"action_required" text NOT NULL,
	"responsible_dept" varchar(100) NOT NULL,
	"is_dc_flag" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sector" (
	"sector_id" serial PRIMARY KEY NOT NULL,
	"sector_code" varchar(20) NOT NULL,
	"sector_name" varchar(100) NOT NULL,
	"sector_icon" varchar(5),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sector_sector_code_unique" UNIQUE("sector_code")
);
--> statement-breakpoint
ALTER TABLE "project_cost" ADD CONSTRAINT "project_cost_project_id_project_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE no action ON UPDATE no action;