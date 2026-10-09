/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ARENA_WHATSAPP?: string;
  readonly VITE_ARENA_TIMEZONE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
