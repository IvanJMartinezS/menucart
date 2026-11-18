import { zodResolver } from '@hookform/resolvers/zod'
import { type PlanInput, planErrors, planInputSchema, planLength } from '@menucart/shared'
import { CalendarDays } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FieldError } from '../../components/ui/FieldError.tsx'
import { inputClassName } from '../../components/ui/form-styles.ts'
import { ApiError } from '../../lib/api.ts'
import { useCreatePlan } from './queries.ts'

type CreatePlanFormProps = {
  /** Dates proposed by the API: the day after the previous plan, lasting 15 days. */
  suggestion: PlanInput
}

/** First screen of the plan tab when there is no plan: choose its dates and start it. */
export function CreatePlanForm({ suggestion }: CreatePlanFormProps) {
  const { t } = useTranslation()
  const createPlan = useCreatePlan()
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PlanInput>({ resolver: zodResolver(planInputSchema), defaultValues: suggestion })
  const [startDate, endDate] = useWatch({ control, name: ['startDate', 'endDate'] })
  const isValidRange = Boolean(startDate && endDate && endDate >= startDate)

  const endDateError = errors.endDate?.message
  const endDateMessage =
    errors.endDate?.type === 'overlap'
      ? t('plan.create.errors.overlap')
      : endDateError === planErrors.endBeforeStart
        ? t('plan.create.errors.endBeforeStart')
        : endDateError === planErrors.tooLong
          ? t('plan.create.errors.tooLong')
          : errors.endDate && t('plan.create.errors.date')

  const submit = handleSubmit(async (input) => {
    try {
      await createPlan.mutateAsync(input)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError('endDate', { type: 'overlap' })
      }
    }
  })

  return (
    <section
      aria-labelledby="create-plan-title"
      className="flex max-w-xl flex-col gap-6 rounded-3xl border border-line bg-surface p-6"
    >
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
          <CalendarDays aria-hidden="true" className="size-6" strokeWidth={1.75} />
        </span>
        <div>
          <h2 id="create-plan-title" className="font-display text-2xl font-medium">
            {t('plan.create.title')}
          </h2>
          <p className="mt-1 text-muted">{t('plan.create.description')}</p>
        </div>
      </div>

      <form onSubmit={(event) => void submit(event)} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="plan-start" className="font-semibold">
              {t('plan.create.startDate')}
            </label>
            <input
              id="plan-start"
              type="date"
              aria-invalid={errors.startDate ? true : undefined}
              className={inputClassName}
              {...register('startDate')}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="plan-end" className="font-semibold">
              {t('plan.create.endDate')}
            </label>
            <input
              id="plan-end"
              type="date"
              aria-invalid={errors.endDate ? true : undefined}
              aria-describedby={errors.endDate ? 'plan-end-error' : undefined}
              className={inputClassName}
              {...register('endDate')}
            />
          </div>
        </div>

        {isValidRange && !endDateMessage && (
          <p className="text-sm font-semibold text-accent-strong">
            {t('plan.length', { count: planLength({ startDate, endDate }) })}
          </p>
        )}
        {errors.startDate && <FieldError>{t('plan.create.errors.date')}</FieldError>}
        {endDateMessage && <FieldError id="plan-end-error">{endDateMessage}</FieldError>}

        {createPlan.isError && errors.endDate?.type !== 'overlap' && (
          <p role="alert" className="rounded-2xl bg-accent-soft px-4 py-3 font-medium text-danger">
            {t('plan.create.errors.save')}
          </p>
        )}

        <button
          type="submit"
          disabled={createPlan.isPending}
          className="inline-flex min-h-11 items-center justify-center self-start rounded-full bg-accent px-6 font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
        >
          {createPlan.isPending ? t('plan.create.creating') : t('plan.create.submit')}
        </button>
      </form>
    </section>
  )
}
