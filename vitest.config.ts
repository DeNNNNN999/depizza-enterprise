import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '.storybook/',
        'storybook-static/',
        '**/*.d.ts',
        '**/*.stories.{ts,tsx}',
        'src/app/layout.tsx',
        'src/app/page.tsx',
        'playwright/',
        'drizzle.config.ts',
        'next.config.ts',
        'tailwind.config.ts',
        'postcss.config.mjs',
        'eslint.config.mjs',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});