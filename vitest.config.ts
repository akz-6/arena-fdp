import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/*.e2e.ts',
      'tests/e2e/**',
      'tests/a11y/**',
      'tests/perf/**',
      'tests/load/**',
    ],
    coverage: {
      exclude: ['**/index.ts', '**/*.d.ts', '**/.next/**', 'next.config.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
