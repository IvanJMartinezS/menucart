import { zodResolver } from '@hookform/resolvers/zod'
import {
  type GroceryInput,
  groceryCategories,
  groceryFrequencies,
  groceryInputSchema,
  groceryUnits,
} from '@menucart/shared'
import { useId, useRef } from 'react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FieldError } from '../../components/ui/FieldError.tsx'
import { inputClassName } from '../../components/ui/form-styles.ts'
import { Modal } from '../../components/ui/Modal.tsx'
import { ApiError } from '../../lib/api.ts'
import { type Grocery, useSaveGrocery } from './queries.ts'

type GroceryFormDialogProps = {
  /** The grocery to edit, or `undefined` to create a new one. */
  grocery?: Grocery
  onClose: () => void
}

const newGrocery: GroceryInput = {
  name: '',
  category: 'pantry',
  defaultQuantity: 1,
  unit: 'unit',
  frequency: 'biweekly',
}

/** A group of options shown as buttons: one tap to choose, no dropdown. */
function OptionGroup({
  legend,
  hint,
  options,
  field,
}: {
  legend: string
  hint?: string
  options: { value: string; label: string }[]
  field: UseFormRegisterReturn
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex min-h-11 cursor-pointer items-center rounded-full border border-line px-4 text-sm font-semibold text-muted transition-colors has-checked:border-ink has-checked:bg-ink has-checked:text-cream has-focus-visible:ring-2 has-focus-visible:ring-accent"
          >
            <input type="radio" value={option.value} className="sr-only" {...field} />
            {option.label}
          </label>
        ))}
      </div>
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </fieldset>
  )
}

/**
 * Panel to create or edit a grocery over the groceries page.
 * Validation uses the same Zod schema as the API; a duplicate name is explained in its field.
 */
export function GroceryFormDialog({ grocery, onClose }: GroceryFormDialogProps) {
  const { t } = useTranslation()
  const titleId = useId()
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  const saveGrocery = useSaveGrocery()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<GroceryInput>({
    resolver: zodResolver(groceryInputSchema),
    defaultValues: grocery
      ? {
          name: grocery.name,
          category: grocery.category,
          defaultQuantity: grocery.defaultQuantity,
          unit: grocery.unit,
          frequency: grocery.frequency,
        }
      : newGrocery,
  })
  const { ref: registerNameRef, ...nameField } = register('name')
  const isDuplicate = errors.name?.type === 'duplicate'

  const submit = handleSubmit(async (input) => {
    try {
      await saveGrocery.mutateAsync({ id: grocery?.id, input })
      onClose()
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError('name', { type: 'duplicate' }, { shouldFocus: true })
      }
    }
  })

  return (
    <Modal
      open
      onClose={onClose}
      locked={saveGrocery.isPending}
      initialFocusRef={nameInputRef}
      labelledBy={titleId}
    >
      <h2 id={titleId} className="font-display text-2xl leading-snug font-medium">
        {grocery ? t('groceries.form.editTitle') : t('groceries.form.newTitle')}
      </h2>

      <form onSubmit={(event) => void submit(event)} noValidate className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="grocery-name" className="font-semibold">
            {t('groceries.form.name')}
          </label>
          <input
            id="grocery-name"
            type="text"
            maxLength={100}
            autoComplete="off"
            placeholder={t('groceries.form.namePlaceholder')}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'grocery-name-error' : undefined}
            className={inputClassName}
            ref={(element) => {
              registerNameRef(element)
              nameInputRef.current = element
            }}
            {...nameField}
          />
          {errors.name && (
            <FieldError id="grocery-name-error">
              {isDuplicate ? t('groceries.form.errors.duplicate') : t('groceries.form.errors.name')}
            </FieldError>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
            <label htmlFor="grocery-quantity" className="font-semibold">
              {t('groceries.form.quantity')}
            </label>
            <label htmlFor="grocery-unit" className="font-semibold">
              {t('groceries.form.unit')}
            </label>
            <input
              id="grocery-quantity"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              aria-invalid={errors.defaultQuantity ? true : undefined}
              className={inputClassName}
              {...register('defaultQuantity', { valueAsNumber: true })}
            />
            <select id="grocery-unit" className={inputClassName} {...register('unit')}>
              {groceryUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {t(`groceries.units.${unit}`, { count: 2 })}
                </option>
              ))}
            </select>
          </div>
          {errors.defaultQuantity && <FieldError>{t('groceries.form.errors.quantity')}</FieldError>}
        </div>

        <OptionGroup
          legend={t('groceries.form.category')}
          options={groceryCategories.map((category) => ({
            value: category,
            label: t(`groceries.categories.${category}`),
          }))}
          field={register('category')}
        />

        <OptionGroup
          legend={t('groceries.form.frequency')}
          hint={t('groceries.form.frequencyHint')}
          options={groceryFrequencies.map((frequency) => ({
            value: frequency,
            label: t(`groceries.frequencies.${frequency}`),
          }))}
          field={register('frequency')}
        />

        {saveGrocery.isError && !isDuplicate && (
          <p role="alert" className="rounded-2xl bg-accent-soft px-4 py-3 font-medium text-danger">
            {t('groceries.form.saveError')}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saveGrocery.isPending}
            className="inline-flex min-h-11 items-center justify-center rounded-full px-6 font-semibold text-muted transition-colors hover:bg-line/60 hover:text-ink disabled:opacity-60"
          >
            {t('groceries.form.cancel')}
          </button>
          <button
            type="submit"
            disabled={saveGrocery.isPending}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
          >
            {saveGrocery.isPending ? t('groceries.form.saving') : t('groceries.form.save')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
