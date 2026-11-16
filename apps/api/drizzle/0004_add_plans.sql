CREATE TABLE "plan_groceries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"grocery_id" uuid,
	"name" text NOT NULL,
	"category" "grocery_category" NOT NULL,
	"unit" "grocery_unit" NOT NULL,
	"quantity" numeric(8, 2) NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plan_groceries_quantity_positive" CHECK ("plan_groceries"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "plan_menus" (
	"plan_id" uuid NOT NULL,
	"menu_id" uuid NOT NULL,
	"times" smallint DEFAULT 1 NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plan_menus_plan_id_menu_id_pk" PRIMARY KEY("plan_id","menu_id"),
	CONSTRAINT "plan_menus_times_range" CHECK ("plan_menus"."times" between 1 and 31)
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plans_length_range" CHECK ("plans"."end_date" >= "plans"."start_date" and "plans"."end_date" - "plans"."start_date" < 31)
);
--> statement-breakpoint
ALTER TABLE "plan_groceries" ADD CONSTRAINT "plan_groceries_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_groceries" ADD CONSTRAINT "plan_groceries_grocery_id_groceries_id_fk" FOREIGN KEY ("grocery_id") REFERENCES "public"."groceries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_menus" ADD CONSTRAINT "plan_menus_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_menus" ADD CONSTRAINT "plan_menus_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "plan_groceries_plan_grocery_unique" ON "plan_groceries" USING btree ("plan_id","grocery_id");--> statement-breakpoint
CREATE INDEX "plan_menus_menu_id_idx" ON "plan_menus" USING btree ("menu_id");