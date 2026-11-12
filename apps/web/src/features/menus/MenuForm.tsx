import { zodResolver } from '@hookform/resolvers/zod'
import { type MenuInput, menuInputSchema } from '@menucart/shared'
import { Plus } from 'lucide-react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { FieldError } from '../../components/ui/FieldError.tsx'
import { inputClassName } from '../../components/ui/form-styles.ts'
import { IngredientRow } from './IngredientRow.tsx'

type MenuFormProps = {
  /** Values to start with, when editing a menu. */
  defaultValues?: MenuInput
  onSubmit: (values: MenuInput) => void | Promise<void>
  isSaving: boolean
  /** True when the last attempt to save failed. */
  saveFailed: boolean
}

const emptyIngredient = { name: '', quantity: 1, category: 'vegetables' } as const

/**
 * Form to create or edit a menu. Validation uses the same Zod schema as the API,
 * so the rules can never differ between the browser and the server.
 */
export function MenuForm({ defaultValues, onSubmit, isSaving, saveFailed }: MenuFormProps) {
  const { t } = useTranslation()
  const form = useForm<MenuInput>({
    resolver: zodResolver(menuInputSchema),
    defaultValues: defaultValues ?? { name: '', notes: '', ingredients: [emptyIngredient] },
  })
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' })

  const submit = handleSubmit((values) =>
    // An empty note is saved as "no note".
    onSubmit({ ...values, notes: values.notes || undefined }),
  )

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(event) => void submit(event)}
        noValidate
        className="flex max-w-3xl flex-col gap-8"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="menu-name" className="font-semibold">
            {t('menuForm.name')}
          </label>
          <input
            id="menu-name"
            type="text"
            maxLength={120}
            placeholder={t('menuForm.namePlaceholder')}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'menu-name-error' : undefined}
            className={inputClassName}
            {...register('name')}
          />
          {errors.name && <FieldError id="menu-name-error">{t('menuForm.errors.name')}</FieldError>}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="menu-notes" className="font-semibold">
            {t('menuForm.notes')}
          </label>
          <input
            id="menu-notes"
            type="text"
            maxLength={500}
            placeholder={t('menuForm.notesPlaceholder')}
            className={inputClassName}
            {...register('notes')}
          />
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="font-semibold">{t('menuForm.ingredients')}</legend>
          <p className="-mt-1 text-sm text-muted">{t('menuForm.ingredientsHint')}</p>

          <div
            aria-hidden="true"
            className="hidden grid-cols-[6rem_minmax(0,1fr)_10rem_auto] gap-2 px-1 text-xs font-semibold tracking-wide text-muted uppercase md:grid"
          >
            <span>{t('menuForm.quantity')}</span>
            <span>{t('menuForm.ingredient')}</span>
            <span>{t('menuForm.category')}</span>
            <span className="w-11" />
          </div>

          <ol className="flex flex-col gap-4 md:gap-2">
            {fields.map((field, index) => (
              <IngredientRow
                key={field.id}
                rowId={field.id}
                index={index}
                onRemove={() => remove(index)}
                canRemove={fields.length > 1}
              />
            ))}
          </ol>

          {errors.ingredients?.root || errors.ingredients?.message ? (
            <FieldError>{t('menuForm.errors.ingredients')}</FieldError>
          ) : null}

          <button
            type="button"
            onClick={() => append(emptyIngredient)}
            className="inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-line bg-surface px-4 font-semibold transition-colors hover:border-ink"
          >
            <Plus aria-hidden="true" className="size-5" />
            {t('menuForm.addIngredient')}
          </button>
        </fieldset>

        {saveFailed && (
          <p
            role="alert"
            className="rounded-2xl bg-accent-soft px-4 py-3 font-medium text-accent-strong"
          >
            {t('menuForm.saveError')}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <Link
            to="/menus"
            className="inline-flex min-h-11 items-center rounded-full px-6 font-semibold text-muted transition-colors hover:bg-line/60 hover:text-ink"
          >
            {t('menuForm.cancel')}
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
          >
            {isSaving ? t('menuForm.saving') : t('menuForm.save')}
          </button>
        </div>
      </form>
    </FormProvider>
  )
}
