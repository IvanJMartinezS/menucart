/** Environment variables of the web app. Vite only exposes the ones that start with `VITE_`. */
interface ImportMetaEnv {
  /** Base URL of the API, for example `http://127.0.0.1:8787`. */
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
