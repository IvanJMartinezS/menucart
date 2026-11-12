/** Spanish texts. This is the reference language: English must have exactly the same keys. */
export const es = {
  common: {
    loading: 'Cargando…',
    retry: 'Reintentar',
  },
  errors: {
    connection: {
      title: 'No pudimos conectar con el servidor',
      description: 'Revisa tu conexión e inténtalo de nuevo.',
    },
  },
  nav: {
    label: 'Principal',
    menus: 'Menús',
    groceries: 'Víveres',
    plan: 'Quincena',
    shoppingList: 'Lista',
  },
  language: {
    label: 'Idioma',
    es: 'Español',
    en: 'English',
  },
  menus: {
    eyebrow: 'Tus menús',
    title: '¿Qué cocinamos esta quincena?',
    description: 'Guarda tus menús una sola vez, con sus ingredientes, y elígelos cada quincena.',
    ingredientCount_one: '{{count}} ingrediente',
    ingredientCount_other: '{{count}} ingredientes',
    moreIngredients_one: 'y {{count}} más',
    moreIngredients_other: 'y {{count}} más',
    empty: {
      title: 'Todavía no tienes menús',
      description: 'Cuando agregues tus menús con sus ingredientes, aparecerán aquí.',
    },
  },
  groceries: {
    eyebrow: 'Víveres',
    title: 'Lo que siempre hace falta en casa',
    description: 'Tu lista de víveres y charcutería, con la cantidad que sueles comprar.',
    empty: {
      title: 'Todavía no tienes víveres',
      description: 'Agrega los víveres que compras cada quincena o cada mes.',
    },
  },
  plan: {
    eyebrow: 'Quincena',
    title: 'Arma tu quincena',
    description: 'Elige los menús de las próximas dos semanas y marca los víveres que tocan.',
    empty: {
      title: 'Aún no hay una quincena en curso',
      description: 'Cuando empieces una quincena, verás aquí los menús y víveres elegidos.',
    },
  },
  shoppingList: {
    eyebrow: 'Lista de compras',
    title: 'Todo lo que hay que comprar',
    description:
      'Los ingredientes de tus menús y tus víveres, sumados y agrupados como en el mercado.',
    empty: {
      title: 'Tu lista está vacía',
      description: 'La lista se arma sola a partir de la quincena.',
    },
  },
  notFound: {
    title: 'Página no encontrada',
    description: 'La dirección que buscas no existe o fue movida.',
    back: 'Volver a los menús',
  },
}
