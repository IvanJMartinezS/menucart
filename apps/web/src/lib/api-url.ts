/**
 * Checks `VITE_API_URL`, the base of every call to the API. It must be a path of the web app
 * (`/api`, forwarded by Vite to the API) or a full URL. Returns what is wrong, or `null`.
 */
export function apiUrlProblem(value: string | undefined) {
  if (!value) {
    return 'VITE_API_URL is not set. Copy apps/web/.env.example to apps/web/.env.local.'
  }

  const isPath = value.startsWith('/') && !value.startsWith('//')
  const isUrl = /^https?:\/\/[^/]/.test(value)

  if (isPath || isUrl) {
    return null
  }

  return (
    `VITE_API_URL must be a path like /api or a full URL like https://api.example.com, ` +
    `but it is "${value}". Git Bash turns /api into a Windows path (C:/Program Files/Git/api) ` +
    `when it is given on the command line: set it in apps/web/.env.local instead.`
  )
}
