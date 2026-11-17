/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "1"이면 데모 빌드 (.env.demo, 0101) */
  readonly VITE_DEMO?: string;
}
