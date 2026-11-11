CREATE TYPE "public"."ingredient_category" AS ENUM('meat', 'vegetables');--> statement-breakpoint
CREATE TABLE "menu_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_id" uuid NOT NULL,
	"name" text NOT NULL,
	"quantity" numeric(8, 2) NOT NULL,
	"category" "ingredient_category" NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "menu_ingredients_quantity_positive" CHECK ("menu_ingredients"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "menus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "menu_ingredients" ADD CONSTRAINT "menu_ingredients_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "menu_ingredients_menu_id_idx" ON "menu_ingredients" USING btree ("menu_id");