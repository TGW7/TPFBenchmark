/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// HRS marketing-free app shell. The engine is framework-agnostic; this config
// only wires the React UI + the Vitest runner for the engine unit tests.
export default defineConfig({
  plugins: [react()],
  build: {
    // Vite 8 (Rolldown): manualChunks' object form is removed outright, the
    // function form deprecated — codeSplitting.groups is the replacement.
    rolldownOptions: {
      output: {
        // Split heavy vendors into cacheable chunks (and clear the 500 kB warning).
        codeSplitting: {
          groups: [
            { name: 'vendor-react', test: /node_modules\/(react|react-dom)\// },
            { name: 'vendor-supabase', test: /node_modules\/@supabase\/supabase-js/ },
          ],
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
      // Vitest 4 removed coverage.all and defaults to reporting only files a
      // test actually imported — without an explicit `include`, any source
      // file no test ever touches (e.g. src/lib/posthog.ts) would silently
      // vanish from the report instead of showing as 0% covered, defeating
      // the point of a coverage report (surfacing gaps, not hiding them).
      include: ['src/**/*.ts'],
      // Codegen output and UI components aren't unit-tested here (UI is
      // reviewed by hand/screenshot; generated/ is data, not logic) — exclude
      // so the number reflects the engine/data logic these tests actually target.
      exclude: ['src/config/generated/**', 'src/ui/**', 'src/test/**', '**/*.d.ts'],
    },
  },
});
