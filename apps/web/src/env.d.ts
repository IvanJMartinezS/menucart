/** Environment variables of the web app. Vite only exposes the ones that start with `VITE_`. */
interface ImportMetaEnv {
  /** Base URL of the API: `/api` in development, forwarded by Vite to the API. */
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
