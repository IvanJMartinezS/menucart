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
      stillFailing: 'Seguimos sin conexión (último intento a las {{time}}).',
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
    add: 'Agregar menú',
    ingredientCount_one: '{{count}} ingrediente',
    ingredientCount_other: '{{count}} ingredientes',
    moreIngredients_one: 'y {{count}} más',
    moreIngredients_other: 'y {{count}} más',
    empty: {
      title: 'Todavía no tienes menús',
      description: 'Cuando agregues tus menús con sus ingredientes, aparecerán aquí.',
    },
  },
  categories: {
    meat: 'Carnes',
    vegetables: 'Verduras',
  },
  menuForm: {
    newEyebrow: 'Nuevo menú',
    newTitle: 'Agrega un menú',
    editEyebrow: 'Editar menú',
    name: 'Nombre del menú',
    namePlaceholder: 'Bistec con ensalada y maduro',
    notes: 'Notas (opcional)',
    notesPlaceholder: 'Para 2 personas, 2 días',
    ingredients: 'Ingredientes',
    ingredientsHint: 'Escribe las cantidades para todas las personas y días que dura el menú.',
    quantity: 'Cantidad',
    ingredient: 'Ingrediente',
    category: 'Categoría',
    quantityOf: 'Cantidad del ingrediente {{number}}',
    nameOf: 'Ingrediente {{number}}',
    categoryOf: 'Categoría del ingrediente {{number}}',
    remove: 'Quitar ingrediente {{number}}',
    addIngredient: 'Agregar ingrediente',
    save: 'Guardar menú',
    saving: 'Guardando…',
    cancel: 'Cancelar',
    saveError: 'No pudimos guardar el menú. Revisa tu conexión e inténtalo de nuevo.',
    delete: 'Borrar menú',
    deleteDialog: {
      title: '¿Borrar «{{name}}»?',
      description: 'Se borrará el menú con todos sus ingredientes. No se puede deshacer.',
      confirm: 'Sí, borrar',
      deleting: 'Borrando…',
      error: 'No pudimos borrar el menú. Revisa tu conexión e inténtalo de nuevo.',
    },
    notFound: {
      title: 'Este menú no existe',
      description: 'Puede que lo hayan borrado o que la dirección no sea correcta.',
    },
    errors: {
      name: 'Escribe el nombre del menú.',
      ingredientName: 'Escribe el ingrediente.',
      quantity: 'Escribe una cantidad mayor que 0, con hasta 2 decimales.',
      ingredients: 'Agrega al menos un ingrediente.',
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
