# 0004. Plans with free dates, without overlaps

- **Status:** Accepted
- **Step:** 22 (plans schema), extended in 31 (data per household)

## Context

A plan ("quincena") is the period a shopping list is for. Many households shop every two weeks, but not on
fixed days: payday moves, a trip shortens a period, a month has 31 days. Two plans covering the same day
would make it unclear which list is the current one.

## Decision

- A plan has a **start and an end date chosen by the user**, from 1 to 31 days counting both ends (a
  `CHECK` constraint). The API suggests the next dates, but they can be changed.
- **Two plans of a household cannot share a day.** Postgres enforces it with an exclusion constraint:

  ```sql
  EXCLUDE USING gist ("household_id" WITH =, daterange("start_date", "end_date", '[]') WITH &&)
  ```

  Comparing the household with `=` inside a GiST index needs the `btree_gist` extension. The API turns the
  violation into a **409 Conflict** with a clear message.

## Alternatives

- **Fixed periods (1st to 15th, 16th to the end of the month).** Simple, but it does not match how people
  really shop.
- **Checking overlaps only in the API** (a `SELECT` before the `INSERT`). Two requests at the same time can
  both pass the check. The database constraint cannot be skipped by any client or race.

## Consequences

- The rule lives in one place, the database, and covers inserts and updates.
- The constraint cannot be written with Drizzle's schema builder, so it lives in hand-written migrations
  (`0005_prevent_overlapping_plans`, `0011_keep_plans_per_household`).
- Tests check the cases against Postgres itself: a plan that starts on the last day of another overlaps it
  (both ends count), and two households can have plans on the same days.
