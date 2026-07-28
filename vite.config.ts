/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// HRS marketing-free app shell. The engine is framework-agnostic; this config
// only wires the React UI + the Vitest runner for the engine unit tests.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split heavy vendors into cacheable chunks (and clear the 500 kB warning).
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-dom/client'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Never let tests touch a real Supabase project, even with .env.local present.
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Codegen output and UI components aren't unit-tested here (UI is
      // reviewed by hand/screenshot; generated/ is data, not logic) — exclude
      // so the number reflects the engine/data logic these tests actually target.
      exclude: ['src/config/generated/**', 'src/ui/**', 'src/test/**', '**/*.d.ts'],
    },
  },
});
