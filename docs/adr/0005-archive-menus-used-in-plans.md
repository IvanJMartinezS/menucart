# 0005. Archive menus used in plans instead of deleting them

- **Status:** Accepted
- **Step:** 22 (plans schema) and 23 (plans API)

## Context

Plans point to the menus chosen for them. If a menu is deleted, older plans lose part of their content and
their shopping lists change after the fact. But the user still needs to remove menus they no longer cook
from the catalog.

## Decision

- `plan_menus.menu_id` uses `ON DELETE RESTRICT`: the database **refuses** to delete a menu used in a plan.
- `DELETE /menus/:id` tries to delete the menu. If that constraint refuses it, the menu is **archived**
  instead (`archived_at` is set). Both answer 204: for the user, the menu left the catalog.
- Archived menus no longer appear in the catalog and cannot be added to new plans, but the plans that used
  them still show them.
- Groceries go the other way: a plan **copies** the grocery when it is chosen (name, category, unit and
  quantity), so a grocery can be deleted and the plan keeps its copy.

## Alternatives

- **Always delete with `ON DELETE CASCADE`.** Plans silently lose menus.
- **Always archive (soft delete).** Menus never used would pile up in the database forever.
- **Check in the API whether the menu is used before deleting.** It can race with a request that adds the
  menu to a plan at the same time; the constraint cannot.

## Consequences

- History stays true: a plan always shows what was planned.
- Restoring archived menus is possible later (the data is kept); it is in the list of ideas.
- The API tells the two cases apart by the name of the foreign key in the Postgres error.
