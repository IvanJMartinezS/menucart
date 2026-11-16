import {
  groceryCategories,
  groceryFrequencies,
  groceryUnits,
  ingredientCategories,
} from '@menucart/shared'
import { relations, sql } from 'drizzle-orm'
import {
  check,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

/** Where an ingredient shows up in the shopping list. Labels are translated in the web app. */
export const ingredientCategory = pgEnum('ingredient_category', ingredientCategories)

export const menus = pgTable('menus', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  /**
   * When the menu was archived. A menu used in a plan is archived instead of deleted:
   * it leaves the catalog but plans keep it, and it can be restored.
   */
  archivedAt: timestamp('archived_at', { withTimezone: true }),
})

export const menuIngredients = pgTable(
  'menu_ingredients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    menuId: uuid('menu_id')
      .notNull()
      .references(() => menus.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    quantity: numeric('quantity', { precision: 8, scale: 2, mode: 'number' }).notNull(),
    category: ingredientCategory('category').notNull(),
    /** Order in which the ingredients were written in the menu. */
    position: integer('position').notNull(),
  },
  (table) => [
    index('menu_ingredients_menu_id_idx').on(table.menuId),
    check('menu_ingredients_quantity_positive', sql`${table.quantity} > 0`),
  ],
)

export const menusRelations = relations(menus, ({ many }) => ({
  ingredients: many(menuIngredients),
}))

export const menuIngredientsRelations = relations(menuIngredients, ({ one }) => ({
  menu: one(menus, { fields: [menuIngredients.menuId], references: [menus.id] }),
}))

export const groceryCategory = pgEnum('grocery_category', groceryCategories)
export const groceryFrequency = pgEnum('grocery_frequency', groceryFrequencies)
export const groceryUnit = pgEnum('grocery_unit', groceryUnits)

/** Household groceries (pantry and deli), with the amount usually bought each time. */
export const groceries = pgTable(
  'groceries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    category: groceryCategory('category').notNull(),
    defaultQuantity: numeric('default_quantity', {
      precision: 8,
      scale: 2,
      mode: 'number',
    }).notNull(),
    unit: groceryUnit('unit').notNull(),
    frequency: groceryFrequency('frequency').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // The same grocery cannot be saved twice, whatever its capital letters ('Arroz' = 'arroz').
    uniqueIndex('groceries_name_unique').on(sql`lower(${table.name})`),
    check('groceries_default_quantity_positive', sql`${table.defaultQuantity} > 0`),
  ],
)

/**
 * A plan ("quincena"): the days between two dates chosen by the user, for example from the
 * 2nd to the 16th. Plans cannot overlap: migration `0005_prevent_overlapping_plans` adds that
 * rule as an exclusion constraint, which the schema builder cannot express.
 */
export const plans = pgTable(
  'plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    startDate: date('start_date', { mode: 'string' }).notNull(),
    endDate: date('end_date', { mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Between 1 and 31 days, counting both ends (subtracting dates gives the days between them).
    check(
      'plans_length_range',
      sql`${table.endDate} >= ${table.startDate} and ${table.endDate} - ${table.startDate} < 31`,
    ),
  ],
)

/** The menus chosen for a plan. The same menu can be planned several times (`times`). */
export const planMenus = pgTable(
  'plan_menus',
  {
    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id, { onDelete: 'cascade' }),
    // Menus used in a plan are archived, never deleted: the database refuses to delete them.
    menuId: uuid('menu_id')
      .notNull()
      .references(() => menus.id, { onDelete: 'restrict' }),
    times: smallint('times').notNull().default(1),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.planId, table.menuId] }),
    index('plan_menus_menu_id_idx').on(table.menuId),
    check('plan_menus_times_range', sql`${table.times} between 1 and 31`),
  ],
)

/**
 * The groceries chosen for a plan, copied when they are chosen (name, category, unit and
 * quantity): changing or deleting a grocery later never changes a plan already made.
 */
export const planGroceries = pgTable(
  'plan_groceries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id, { onDelete: 'cascade' }),
    // Empty once the grocery is deleted from the catalog; the copied data stays.
    groceryId: uuid('grocery_id').references(() => groceries.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    category: groceryCategory('category').notNull(),
    unit: groceryUnit('unit').notNull(),
    quantity: numeric('quantity', { precision: 8, scale: 2, mode: 'number' }).notNull(),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // A grocery is chosen at most once per plan. It also serves searches by plan_id.
    uniqueIndex('plan_groceries_plan_grocery_unique').on(table.planId, table.groceryId),
    check('plan_groceries_quantity_positive', sql`${table.quantity} > 0`),
  ],
)

export const plansRelations = relations(plans, ({ many }) => ({
  menus: many(planMenus),
  groceries: many(planGroceries),
}))

export const planMenusRelations = relations(planMenus, ({ one }) => ({
  plan: one(plans, { fields: [planMenus.planId], references: [plans.id] }),
  menu: one(menus, { fields: [planMenus.menuId], references: [menus.id] }),
}))

export const planGroceriesRelations = relations(planGroceries, ({ one }) => ({
  plan: one(plans, { fields: [planGroceries.planId], references: [plans.id] }),
  grocery: one(groceries, { fields: [planGroceries.groceryId], references: [groceries.id] }),
}))
