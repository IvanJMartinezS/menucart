import { UtensilsCrossed } from 'lucide-react'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'

export function MenusPage() {
  return (
    <>
      <PageHeader
        eyebrow="Tus menús"
        title="¿Qué cocinamos esta quincena?"
        description="Guarda tus menús una sola vez, con sus ingredientes, y elígelos cada quincena."
      />
      <EmptyState
        icon={UtensilsCrossed}
        title="Todavía no tienes menús"
        description="Cuando agregues tus menús con sus ingredientes, aparecerán aquí."
      />
    </>
  )
}
