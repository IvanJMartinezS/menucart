import { ingredientCategories, type MenuInput } from '@menucart/shared'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useDebouncedValue } from '../../lib/use-debounced-value.ts'
import { ingredientSuggestionsQueryOptions } from '../ingredients/queries.ts'
import { FieldError } from './FieldError.tsx'

type IngredientRowProps = {
  index: number
  /** Stable id of the row, used to link each input with its label and suggestions. */
  rowId: string
  onRemove: () => void
  canRemove: boolean
}

export const inputClassName =
  'min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-base text-ink placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none aria-invalid:border-accent-strong'

/**
 * One ingredient of the menu: quantity, name and category.
 *
 * While the name is being written, it suggests ingredients used in other menus. When the name
 * matches one of them, its usual category is filled in, unless the category was chosen by hand.
 */
export function IngredientRow({ index, rowId, onRemove, canRemove }: IngredientRowProps) {
  const { t } = useTranslation()
  const {
    control,
    register,
    setValue,
    getFieldState,
    formState: { errors },
  } = useFormContext<MenuInput>()
  const number = index + 1
  const rowErrors = errors.ingredients?.[index]
  const nameField = `ingredients.${index}.name` as const
  const categoryField = `ingredients.${index}.category` as const

  // Suggestions are only asked for rows being written, not for rows loaded to edit a menu.
  const [isTyping, setIsTyping] = useState(false)
  const name = useWatch({ control, name: nameField }) ?? ''
  const search = useDebouncedValue(isTyping ? name.trim() : '')
  const { data: suggestions = [] } = useQuery(ingredientSuggestionsQueryOptions(search))
  const suggestionsId = `ingredient-suggestions-${rowId}`

  useEffect(() => {
    if (!isTyping || getFieldState(categoryField).isDirty) {
      return
    }
    const typed = name.trim().toLowerCase()
    const match = suggestions.find((suggestion) => suggestion.name.toLowerCase() === typed)
    if (match) {
      setValue(categoryField, match.category)
    }
  }, [isTyping, name, suggestions, categoryField, getFieldState, setValue])

  const { onChange: onNameChange, ...nameProps } = register(nameField)

  return (
    <li className="grid grid-cols-[5rem_minmax(0,1fr)_auto] gap-2 md:grid-cols-[6rem_minmax(0,1fr)_10rem_auto]">
      <div>
        <label htmlFor={`${rowId}-quantity`} className="sr-only">
          {t('menuForm.quantityOf', { number })}
        </label>
        <input
          id={`${rowId}-quantity`}
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          aria-invalid={rowErrors?.quantity ? true : undefined}
          className={inputClassName}
          {...register(`ingredients.${index}.quantity`, { valueAsNumber: true })}
        />
      </div>

      <div>
        <label htmlFor={`${rowId}-name`} className="sr-only">
          {t('menuForm.nameOf', { number })}
        </label>
        <input
          id={`${rowId}-name`}
          type="text"
          autoComplete="off"
          maxLength={100}
          list={suggestionsId}
          aria-invalid={rowErrors?.name ? true : undefined}
          className={inputClassName}
          {...nameProps}
          onChange={(event) => {
            setIsTyping(true)
            return onNameChange(event)
          }}
        />
        <datalist id={suggestionsId}>
          {suggestions.map((suggestion) => (
            <option key={suggestion.name} value={suggestion.name} />
          ))}
        </datalist>
      </div>

      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label={t('menuForm.remove', { number })}
        className="flex size-11 items-center justify-center rounded-xl text-muted transition-colors hover:bg-line/60 hover:text-ink disabled:invisible md:order-last"
      >
        <X aria-hidden="true" className="size-5" />
      </button>

      <div className="col-span-2 md:col-span-1">
        <label htmlFor={`${rowId}-category`} className="sr-only">
          {t('menuForm.categoryOf', { number })}
        </label>
        <select id={`${rowId}-category`} className={inputClassName} {...register(categoryField)}>
          {ingredientCategories.map((category) => (
            <option key={category} value={category}>
              {t(`categories.${category}`)}
            </option>
          ))}
        </select>
      </div>

      {(rowErrors?.quantity || rowErrors?.name) && (
        <div className="col-span-full flex flex-col gap-1">
          {rowErrors.quantity && <FieldError>{t('menuForm.errors.quantity')}</FieldError>}
          {rowErrors.name && <FieldError>{t('menuForm.errors.ingredientName')}</FieldError>}
        </div>
      )}
    </li>
  )
}
