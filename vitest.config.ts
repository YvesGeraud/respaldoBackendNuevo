import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    // Necesario para que los imports @/ funcionen igual que en el código fuente
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    // Se ejecuta antes de cada archivo de test — carga las variables de entorno
    setupFiles: ['./tests/setup.ts'],
    // Evita que vitest descubra archivos .test.js compilados en dist/
    exclude: ['dist/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: [
        'src/generated/**',
        'src/server.ts', // punto de entrada, no tiene lógica testeable
        'tests/**',
        'node_modules/**',
        'dist/**',
      ],
    },
  },
});
