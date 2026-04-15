import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
  },
  resolve: {
    alias: {
      '@arqyx/shared': fileURLToPath(new URL('../shared/src/index.ts', import.meta.url)),
    },
  },
});
