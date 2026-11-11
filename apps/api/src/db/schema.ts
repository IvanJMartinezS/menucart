import { ingredientCategories } from '@menucart/shared'
import { relations, sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
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
