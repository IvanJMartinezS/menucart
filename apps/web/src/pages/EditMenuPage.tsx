import { useQuery } from '@tanstack/react-query'
import { SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { ErrorState } from '../components/ui/ErrorState.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { MenuForm } from '../features/menus/MenuForm.tsx'
import { menuQueryOptions, useSaveMenu } from '../features/menus/queries.ts'
import { ApiError } from '../lib/api.ts'

export function EditMenuPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const { data: menu, isPending, error, refetch, isFetching } = useQuery(menuQueryOptions(id))
  const saveMenu = useSaveMenu(id)

  if (isPending) {
    return (
      <p role="status" className="text-muted">
        {t('common.loading')}
      </p>
    )
  }

  if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
    return (
      <EmptyState
        icon={SearchX}
        title={t('menuForm.notFound.title')}
        description={t('menuForm.notFound.description')}
      >
        <Link
          to="/menus"
          className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 font-semibold text-white transition-colors hover:bg-accent-strong"
        >
          {t('notFound.back')}
        </Link>
      </EmptyState>
    )
  }

  if (error) {
    return <ErrorState onRetry={() => void refetch()} isRetrying={isFetching} />
  }

  return (
    <>
      <PageHeader eyebrow={t('menuForm.editEyebrow')} title={menu.name} />
      <MenuForm
        defaultValues={{
          name: menu.name,
          notes: menu.notes ?? '',
          ingredients: menu.ingredients.map(({ name, quantity, category }) => ({
            name,
            quantity,
            category,
          })),
        }}
        onSubmit={async (values) => {
          try {
            await saveMenu.mutateAsync(values)
            await navigate('/menus')
          } catch {
            // The form shows the error and keeps what was written.
          }
        }}
        isSaving={saveMenu.isPending}
        saveFailed={saveMenu.isError}
      />
    </>
  )
}
