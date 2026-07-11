/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MSW?: string
  readonly VITE_BACKEND_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
