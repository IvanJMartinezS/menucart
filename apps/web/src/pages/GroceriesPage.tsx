import { ShoppingBasket } from 'lucide-react'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'

export function GroceriesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Víveres"
        title="Lo que siempre hace falta en casa"
        description="Tu lista de víveres y charcutería, con la cantidad que sueles comprar."
      />
      <EmptyState
        icon={ShoppingBasket}
        title="Todavía no tienes víveres"
        description="Agrega los víveres que compras cada quincena o cada mes."
      />
    </>
  )
}
