/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Bajo Vitest, el preprocesador de CSS de vite-plugin-svelte falla al resolver
// la configuración (incompatibilidad conocida con Vite 6). Los estilos no
// importan en jsdom, así que los retiramos antes de compilar el componente.
function stripSvelteStyles(): Plugin {
  return {
    name: 'test-strip-svelte-styles',
    enforce: 'pre',
    transform(code, id) {
      if (!process.env.VITEST || !id.endsWith('.svelte')) return null;
      return { code: code.replace(/<style[\s\S]*?<\/style>/g, ''), map: null };
    },
  };
}

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [...(process.env.VITEST ? [stripSvelteStyles()] : []), svelte()],
  build: {
    target: 'es2022',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/components/**/*.test.ts'],
    server: {
      deps: { inline: ['pdfmake'] },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/**/*.d.ts', 'src/lib/ocr.ts'],
      thresholds: {
        global: { lines: 80, functions: 80, branches: 80, statements: 80 },
        'src/lib/pdf/**/*.ts': { lines: 90, functions: 90, branches: 90, statements: 90 },
        'src/lib/authors.ts': { lines: 90, functions: 90, branches: 90, statements: 90 },
        'src/lib/dates.ts': { lines: 90, functions: 90, branches: 90, statements: 90 },
      },
    },
  },
  resolve: {
    conditions: process.env.VITEST ? ['browser'] : undefined,
  },
});
