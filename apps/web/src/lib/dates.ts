/** Today in the user's own calendar, as `YYYY-MM-DD` (not in UTC, unlike `toISOString`). */
export function todayIso(now = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/**
 * A `YYYY-MM-DD` date as "17 nov" (or "Nov 17" in English), in the given language.
 * It is read as noon UTC and shown in UTC, so no time zone can move it to another day.
 */
export function formatShortDate(isoDate: string, language: string) {
  return new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate}T12:00:00Z`))
}
