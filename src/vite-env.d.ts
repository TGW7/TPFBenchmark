/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL (the SAME project as the TPF app). Optional: absent ⇒ anonymous-only. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon/public key. Optional: absent ⇒ anonymous-only. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
