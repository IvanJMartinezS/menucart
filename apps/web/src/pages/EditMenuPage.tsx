import { useQuery } from '@tanstack/react-query'
import { SearchX, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { ConfirmDialog } from '../components/ui/ConfirmDialog.tsx'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { ErrorState } from '../components/ui/ErrorState.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { MenuForm } from '../features/menus/MenuForm.tsx'
import { menuQueryOptions, useDeleteMenu, useSaveMenu } from '../features/menus/queries.ts'
import { ApiError } from '../lib/api.ts'

export function EditMenuPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const { data: menu, isPending, error, refetch, isFetching } = useQuery(menuQueryOptions(id))
  const saveMenu = useSaveMenu(id)
  const deleteMenu = useDeleteMenu(id)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

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
      <PageHeader
        eyebrow={t('menuForm.editEyebrow')}
        title={menu.name}
        action={
          <button
            type="button"
            onClick={() => {
              deleteMenu.reset()
              setIsConfirmingDelete(true)
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-danger/40 px-5 font-semibold text-danger transition-colors hover:border-danger hover:bg-danger/5"
          >
            <Trash2 aria-hidden="true" className="size-5" />
            {t('menuForm.delete')}
          </button>
        }
      />
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
      <ConfirmDialog
        open={isConfirmingDelete}
        title={t('menuForm.deleteDialog.title', { name: menu.name })}
        description={t('menuForm.deleteDialog.description')}
        confirmLabel={t('menuForm.deleteDialog.confirm')}
        cancelLabel={t('menuForm.cancel')}
        pendingLabel={t('menuForm.deleteDialog.deleting')}
        isPending={deleteMenu.isPending}
        error={deleteMenu.isError ? t('menuForm.deleteDialog.error') : undefined}
        onCancel={() => setIsConfirmingDelete(false)}
        onConfirm={() => {
          deleteMenu.mutate(undefined, {
            onSuccess: () => void navigate('/menus', { replace: true }),
          })
        }}
      />
    </>
  )
}
