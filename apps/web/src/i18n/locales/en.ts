import type { es } from './es.ts'

/** English texts. Typed with the shape of Spanish, so a missing key is a compile error. */
export const en: typeof es = {
  common: {
    loading: 'Loading…',
    retry: 'Try again',
  },
  errors: {
    connection: {
      title: 'We could not reach the server',
      description: 'Check your connection and try again.',
      stillFailing: 'Still no connection (last attempt at {{time}}).',
    },
  },
  nav: {
    label: 'Main',
    menus: 'Menus',
    groceries: 'Groceries',
    plan: 'Plan',
    shoppingList: 'List',
  },
  language: {
    label: 'Language',
    es: 'Español',
    en: 'English',
  },
  menus: {
    eyebrow: 'Your menus',
    title: 'What are we cooking these two weeks?',
    description: 'Save your menus once, with their ingredients, and pick them every two weeks.',
    add: 'Add menu',
    ingredientCount_one: '{{count}} ingredient',
    ingredientCount_other: '{{count}} ingredients',
    moreIngredients_one: 'and {{count}} more',
    moreIngredients_other: 'and {{count}} more',
    empty: {
      title: 'You have no menus yet',
      description: 'Once you add your menus with their ingredients, they will show up here.',
    },
  },
  categories: {
    meat: 'Meat',
    vegetables: 'Vegetables',
  },
  menuForm: {
    newEyebrow: 'New menu',
    newTitle: 'Add a menu',
    editEyebrow: 'Edit menu',
    name: 'Menu name',
    namePlaceholder: 'Steak with salad and plantain',
    notes: 'Notes (optional)',
    notesPlaceholder: 'For 2 people, 2 days',
    ingredients: 'Ingredients',
    ingredientsHint: 'Write the amounts for everyone and for all the days the menu lasts.',
    quantity: 'Quantity',
    ingredient: 'Ingredient',
    category: 'Category',
    quantityOf: 'Quantity of ingredient {{number}}',
    nameOf: 'Ingredient {{number}}',
    categoryOf: 'Category of ingredient {{number}}',
    remove: 'Remove ingredient {{number}}',
    addIngredient: 'Add ingredient',
    save: 'Save menu',
    saving: 'Saving…',
    cancel: 'Cancel',
    saveError: 'We could not save the menu. Check your connection and try again.',
    delete: 'Delete menu',
    deleteDialog: {
      title: 'Delete “{{name}}”?',
      description: 'The menu and all its ingredients will be deleted. This cannot be undone.',
      confirm: 'Yes, delete',
      deleting: 'Deleting…',
      error: 'We could not delete the menu. Check your connection and try again.',
    },
    notFound: {
      title: 'This menu does not exist',
      description: 'It may have been deleted, or the address is not right.',
    },
    errors: {
      name: 'Write the name of the menu.',
      ingredientName: 'Write the ingredient.',
      quantity: 'Write a quantity greater than 0, with up to 2 decimals.',
      ingredients: 'Add at least one ingredient.',
    },
  },
  groceries: {
    eyebrow: 'Groceries',
    title: 'What the house always needs',
    description: 'Your list of pantry and deli items, with the amount you usually buy.',
    empty: {
      title: 'You have no groceries yet',
      description: 'Add the groceries you buy every two weeks or every month.',
    },
  },
  plan: {
    eyebrow: 'Plan',
    title: 'Plan your two weeks',
    description: 'Pick the menus for the next two weeks and check the groceries you need.',
    empty: {
      title: 'There is no plan in progress',
      description: 'Once you start a plan, the chosen menus and groceries will show up here.',
    },
  },
  shoppingList: {
    eyebrow: 'Shopping list',
    title: 'Everything you need to buy',
    description: 'The ingredients of your menus and your groceries, added up and grouped by aisle.',
    empty: {
      title: 'Your list is empty',
      description: 'The list is built from your plan.',
    },
  },
  notFound: {
    title: 'Page not found',
    description: 'The address you are looking for does not exist or was moved.',
    back: 'Back to menus',
  },
}
