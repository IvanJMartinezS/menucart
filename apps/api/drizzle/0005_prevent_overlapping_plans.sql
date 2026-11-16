-- Two plans cannot share any day. The database checks it on every insert or update, so no
-- client (or concurrent request) can ever save overlapping plans.
-- `daterange(start, end, '[]')` includes both ends; `&&` means "the ranges overlap".
ALTER TABLE "plans"
  ADD CONSTRAINT "plans_no_overlap"
  EXCLUDE USING gist (daterange("start_date", "end_date", '[]') WITH &&);
