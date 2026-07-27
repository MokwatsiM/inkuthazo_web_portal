/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENVIRONMENT: string;
  readonly VITE_RECAPTCHA_SITE_KEY: string;
  /** "true" connects to the local Firebase Emulator Suite (dev only) */
  readonly VITE_USE_EMULATORS: string;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
