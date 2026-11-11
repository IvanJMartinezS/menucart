import type { es } from './es.ts'

/** English texts. Typed with the shape of Spanish, so a missing key is a compile error. */
export const en: typeof es = {
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
    empty: {
      title: 'You have no menus yet',
      description: 'Once you add your menus with their ingredients, they will show up here.',
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
