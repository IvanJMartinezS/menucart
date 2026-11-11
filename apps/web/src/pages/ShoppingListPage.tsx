import { ClipboardList } from 'lucide-react'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'

export function ShoppingListPage() {
  return (
    <>
      <PageHeader
        eyebrow="Lista de compras"
        title="Todo lo que hay que comprar"
        description="Los ingredientes de tus menús y tus víveres, sumados y agrupados como en el mercado."
      />
      <EmptyState
        icon={ClipboardList}
        title="Tu lista está vacía"
        description="La lista se arma sola a partir de la quincena."
      />
    </>
  )
}
