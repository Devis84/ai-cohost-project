/**
 * Stub for @capacitor/core — used by Vitest in the absence of the real package.
 * Real Capacitor behavior is provided by the actual npm package at runtime;
 * in tests this module is always replaced via vi.mock('@capacitor/core').
 */
export const Capacitor = {
  isNativePlatform: () => false,
  getPlatform: () => 'web',
}
