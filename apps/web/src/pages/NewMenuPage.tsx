import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { MenuForm } from '../features/menus/MenuForm.tsx'
import { useSaveMenu } from '../features/menus/queries.ts'

export function NewMenuPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const saveMenu = useSaveMenu()

  return (
    <>
      <PageHeader eyebrow={t('menuForm.newEyebrow')} title={t('menuForm.newTitle')} />
      <MenuForm
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
