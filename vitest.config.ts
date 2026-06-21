import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    pool: 'vmThreads',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      // Capacitor packages are not installed in the dev/test environment.
      // Stub modules allow Vite's import analysis to resolve them; vi.mock()
      // in individual test files replaces them with controllable fakes.
      '@capacitor/core': path.resolve(__dirname, './__mocks__/@capacitor/core.ts'),
      '@capacitor/push-notifications': path.resolve(
        __dirname,
        './__mocks__/@capacitor/push-notifications.ts',
      ),
    },
  },
})
