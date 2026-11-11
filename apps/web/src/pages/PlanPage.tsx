import { CalendarDays } from 'lucide-react'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'

export function PlanPage() {
  return (
    <>
      <PageHeader
        eyebrow="Quincena"
        title="Arma tu quincena"
        description="Elige los menús de las próximas dos semanas y marca los víveres que tocan."
      />
      <EmptyState
        icon={CalendarDays}
        title="Aún no hay una quincena en curso"
        description="Cuando empieces una quincena, verás aquí los menús y víveres elegidos."
      />
    </>
  )
}
