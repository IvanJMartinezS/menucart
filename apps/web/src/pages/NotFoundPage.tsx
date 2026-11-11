import { SearchX } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState } from '../components/ui/EmptyState.tsx'

export function NotFoundPage() {
  return (
    <EmptyState
      icon={SearchX}
      title="Página no encontrada"
      description="La dirección que buscas no existe o fue movida."
    >
      <Link
        to="/"
        className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 font-semibold text-white transition-colors hover:bg-accent-strong"
      >
        Volver a los menús
      </Link>
    </EmptyState>
  )
}
