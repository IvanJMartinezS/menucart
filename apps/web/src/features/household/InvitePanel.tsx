import { Check, Copy, Send, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type Invitation, useCreateInvitation } from './queries.ts'

/** The link that opens the registration with the code already typed. */
const registerLink = (code: string) =>
  `${window.location.origin}/register?code=${encodeURIComponent(code)}`

function InvitationCode({
  invitation,
  inviterName,
}: {
  invitation: Invitation
  inviterName: string
}) {
  const { t, i18n } = useTranslation()
  const [copied, setCopied] = useState(false)
  const link = registerLink(invitation.code)
  const expires = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(invitation.expiresAt))
  const shareText = t('household.invite.shareText', {
    name: inviterName,
    link,
    code: invitation.code,
  })

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      // Without clipboard access (old browser or no permission) the code is still on screen.
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-accent-soft p-4">
      <div>
        <p className="text-sm font-semibold text-muted">{t('household.invite.code')}</p>
        <p className="font-mono text-3xl font-bold tracking-widest text-accent-strong">
          {invitation.code}
        </p>
        <p className="mt-1 text-sm text-muted">
          {t('household.invite.expires', { date: expires })}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 font-semibold transition-colors hover:bg-cream"
        >
          {copied ? (
            <Check aria-hidden="true" className="size-5" />
          ) : (
            <Copy aria-hidden="true" className="size-5" />
          )}
          {copied ? t('household.invite.copied') : t('household.invite.copy')}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-olive px-4 font-semibold text-white transition-colors hover:opacity-90"
        >
          <Send aria-hidden="true" className="size-5" />
          {t('household.invite.share')}
        </a>
      </div>
    </div>
  )
}

/** Creates a code for the second person of the household, ready to copy or send. */
export function InvitePanel({ inviterName }: { inviterName: string }) {
  const { t } = useTranslation()
  const createInvitation = useCreateInvitation()

  return (
    <section
      aria-labelledby="invite-title"
      className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-6"
    >
      <div>
        <h2 id="invite-title" className="font-display text-2xl font-medium">
          {t('household.invite.title')}
        </h2>
        <p className="mt-1 text-muted">{t('household.invite.description')}</p>
      </div>

      {createInvitation.data && (
        <InvitationCode invitation={createInvitation.data} inviterName={inviterName} />
      )}

      {createInvitation.isError && (
        <p role="alert" className="rounded-2xl bg-accent-soft px-4 py-3 font-medium text-danger">
          {t('household.invite.error')}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => createInvitation.mutate()}
          disabled={createInvitation.isPending}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-6 font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
        >
          <UserPlus aria-hidden="true" className="size-5" />
          {createInvitation.isPending
            ? t('household.invite.creating')
            : createInvitation.data
              ? t('household.invite.createAnother')
              : t('household.invite.create')}
        </button>
        {createInvitation.data && (
          <p className="text-sm text-muted">{t('household.invite.replaces')}</p>
        )}
      </div>
    </section>
  )
}
