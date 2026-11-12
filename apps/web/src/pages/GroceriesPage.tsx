import { type GroceryCategory, type GroceryFrequency, groceryCategories } from '@menucart/shared'
import { useQuery } from '@tanstack/react-query'
import { Pencil, Plus, ShoppingBasket, Trash2 } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '../components/ui/ConfirmDialog.tsx'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { ErrorState } from '../components/ui/ErrorState.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { formatQuantity } from '../features/groceries/format.ts'
import { GroceryFormDialog } from '../features/groceries/GroceryFormDialog.tsx'
import {
  type Grocery,
  groceriesQueryOptions,
  useDeleteGrocery,
} from '../features/groceries/queries.ts'

const addButtonClassName =
  'inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-6 font-semibold text-white transition-colors hover:bg-accent-strong'

/** Each frequency has its own color, so they can be told apart at a glance. */
const frequencyClassName: Record<GroceryFrequency, string> = {
  biweekly: 'bg-accent-soft text-accent-strong',
  monthly: 'bg-olive/10 text-olive',
  occasional: 'bg-line/70 text-muted',
}

/** What the form panel is showing: nothing, a new grocery or an existing one. */
type FormTarget = { kind: 'closed' } | { kind: 'new' } | { kind: 'edit'; grocery: Grocery }

export function GroceriesPage() {
  const { t, i18n } = useTranslation()
  const {
    data: groceries,
    isPending,
    isError,
    refetch,
    isFetching,
    errorUpdateCount,
    errorUpdatedAt,
  } = useQuery(groceriesQueryOptions)
  const [formTarget, setFormTarget] = useState<FormTarget>({ kind: 'closed' })
  const [toDelete, setToDelete] = useState<Grocery>()
  const deleteGrocery = useDeleteGrocery()

  const addButton = (
    <button
      type="button"
      onClick={() => setFormTarget({ kind: 'new' })}
      className={addButtonClassName}
    >
      <Plus aria-hidden="true" className="size-5" />
      {t('groceries.add')}
    </button>
  )

  let content: ReactNode

  if (isPending) {
    content = (
      <p role="status" className="text-muted">
        {t('common.loading')}
      </p>
    )
  } else if (isError) {
    content = (
      <ErrorState
        onRetry={() => void refetch()}
        isRetrying={isFetching}
        lastFailedRetryAt={errorUpdateCount > 1 ? errorUpdatedAt : undefined}
      />
    )
  } else if (groceries.length === 0) {
    content = (
      <EmptyState
        icon={ShoppingBasket}
        title={t('groceries.empty.title')}
        description={t('groceries.empty.description')}
      >
        {addButton}
      </EmptyState>
    )
  } else {
    const byCategory = (category: GroceryCategory) =>
      groceries.filter((grocery) => grocery.category === category)

    content = (
      <div className="flex flex-col gap-8">
        {groceryCategories
          .filter((category) => byCategory(category).length > 0)
          .map((category) => (
            <section key={category} aria-labelledby={`category-${category}`}>
              <h2
                id={`category-${category}`}
                className="mb-3 font-display text-2xl font-medium tracking-tight"
              >
                {t(`groceries.categories.${category}`)}
              </h2>
              <ul className="divide-y divide-line rounded-3xl border border-line bg-surface">
                {byCategory(category).map((grocery) => (
                  <li key={grocery.id} className="flex items-center gap-3 py-2 pr-2 pl-5">
                    <div className="flex min-w-0 flex-1 flex-col gap-1 py-1 sm:flex-row sm:items-center sm:gap-3">
                      <span className="truncate font-semibold">{grocery.name}</span>
                      <span className="text-sm text-muted">
                        {formatQuantity(t, i18n.language, grocery.defaultQuantity, grocery.unit)}
                      </span>
                      <span
                        className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-bold ${frequencyClassName[grocery.frequency]}`}
                      >
                        {t(`groceries.frequencies.${grocery.frequency}`)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormTarget({ kind: 'edit', grocery })}
                      aria-label={t('groceries.edit', { name: grocery.name })}
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-line/60 hover:text-ink"
                    >
                      <Pencil aria-hidden="true" className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteGrocery.reset()
                        setToDelete(grocery)
                      }}
                      aria-label={t('groceries.delete', { name: grocery.name })}
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-danger/5 hover:text-danger"
                    >
                      <Trash2 aria-hidden="true" className="size-5" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
      </div>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow={t('groceries.eyebrow')}
        title={t('groceries.title')}
        description={t('groceries.description')}
        // The empty state already shows this action.
        action={groceries && groceries.length > 0 ? addButton : undefined}
      />
      {content}

      {formTarget.kind !== 'closed' && (
        <GroceryFormDialog
          // A new key per target, so the form always starts from the right values.
          key={formTarget.kind === 'edit' ? formTarget.grocery.id : 'new'}
          grocery={formTarget.kind === 'edit' ? formTarget.grocery : undefined}
          onClose={() => setFormTarget({ kind: 'closed' })}
        />
      )}

      <ConfirmDialog
        open={toDelete !== undefined}
        title={t('groceries.deleteDialog.title', { name: toDelete?.name })}
        description={t('groceries.deleteDialog.description')}
        confirmLabel={t('groceries.deleteDialog.confirm')}
        cancelLabel={t('groceries.form.cancel')}
        pendingLabel={t('groceries.deleteDialog.deleting')}
        isPending={deleteGrocery.isPending}
        error={deleteGrocery.isError ? t('groceries.deleteDialog.error') : undefined}
        onCancel={() => setToDelete(undefined)}
        onConfirm={() => {
          if (toDelete) {
            deleteGrocery.mutate(toDelete.id, { onSuccess: () => setToDelete(undefined) })
          }
        }}
      />
    </>
  )
}
