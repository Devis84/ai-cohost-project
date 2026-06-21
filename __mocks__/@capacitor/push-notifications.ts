/**
 * Stub for @capacitor/push-notifications — used by Vitest when the real package
 * is absent. All methods are no-ops; tests replace this via vi.mock.
 */
export const PushNotifications = {
  requestPermissions: async () => ({ receive: 'granted' }),
  register: async () => undefined,
  createChannel: async () => undefined,
  addListener: async () => ({ remove: () => undefined }),
}
