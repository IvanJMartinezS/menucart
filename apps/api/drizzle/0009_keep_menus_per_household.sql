-- Edited by hand: the column is filled in before it becomes NOT NULL, so menus saved before
-- accounts existed are kept. They go to the first household registered; if there is none yet,
-- one is created for them, so this migration works on any database.
ALTER TABLE "menus" ADD COLUMN "household_id" uuid;--> statement-breakpoint
INSERT INTO "households" ("name")
  SELECT 'Mi hogar'
  WHERE EXISTS (SELECT 1 FROM "menus") AND NOT EXISTS (SELECT 1 FROM "households");--> statement-breakpoint
UPDATE "menus"
  SET "household_id" = (SELECT "id" FROM "households" ORDER BY "created_at", "id" LIMIT 1);--> statement-breakpoint
ALTER TABLE "menus" ALTER COLUMN "household_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "menus" ADD CONSTRAINT "menus_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "menus_household_id_idx" ON "menus" USING btree ("household_id");
