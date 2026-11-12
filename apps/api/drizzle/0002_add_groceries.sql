CREATE TYPE "public"."grocery_category" AS ENUM('pantry', 'deli');--> statement-breakpoint
CREATE TYPE "public"."grocery_frequency" AS ENUM('biweekly', 'monthly', 'occasional');--> statement-breakpoint
CREATE TYPE "public"."grocery_unit" AS ENUM('unit', 'kg', 'g', 'l', 'ml', 'package');--> statement-breakpoint
CREATE TABLE "groceries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" "grocery_category" NOT NULL,
	"default_quantity" numeric(8, 2) NOT NULL,
	"unit" "grocery_unit" NOT NULL,
	"frequency" "grocery_frequency" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "groceries_default_quantity_positive" CHECK ("groceries"."default_quantity" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "groceries_name_unique" ON "groceries" USING btree (lower("name"));