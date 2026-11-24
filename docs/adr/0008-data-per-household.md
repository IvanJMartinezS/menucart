# 0008. Data per household, joined with one-time invitations

- **Status:** Accepted
- **Step:** 28 (accounts and households) and 31 (data per household)

## Context

Menus, groceries and plans are shared by the people who shop together, usually a couple or a family. Each
person needs their own account, but they must all see and change the same data. Anybody can register, so
the data of one household must never be visible to another.

## Decision

- A **household** owns the data: `menus`, `groceries` and `plans` have a `household_id`, and each user
  belongs to one household.
- Registering without a code creates a new household. To join one, a member creates an **invitation code**:
  10 characters without the ones that look alike (`0`/`O`, `1`/`I`/`L`), valid for **24 hours**, usable
  **once**, and only one active per household. Only its SHA-256 hash is saved.
- A code is used with a single `UPDATE … WHERE not used AND not expired RETURNING`, so two people using it at
  the same time cannot both join. Wrong codes count as failed attempts
  ([ADR 0007](0007-password-hashing-and-attempt-limits.md)).
- Every query filters by the household of the session. An id of another household answers **404**, the same
  as one that does not exist, so ids cannot be probed. `household_id` is never part of the responses.
- Data saved before accounts existed was moved to the first household by hand-written migrations.

## Alternatives

- **Data per user.** Simpler, but a couple would need one shared account and password.
- **Postgres row-level security.** Strong, but it needs a database role and a setting per request, which
  is harder with one connection per request on Workers. Filtering in every query is explicit and is tested.
- **Invitation links by email.** Need an email provider and a domain. The code can be shared by WhatsApp or
  read aloud.
- **Answering 403 for data of another household.** It would confirm that the id exists.

## Consequences

- Every new query must filter by household. `household-isolation.test.ts` checks the data of two
  households on every resource, and fails if an endpoint of household data is added without session.
- Grocery names only need to be unique inside a household (two households can each have "Rice").
- Moving to another household or leaving one is not possible yet.
