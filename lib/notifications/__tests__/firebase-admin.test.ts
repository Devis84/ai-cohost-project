import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock firebase-admin before importing our module
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(),
  cert: vi.fn(),
}))

vi.mock('firebase-admin/messaging', () => ({
  getMessaging: vi.fn(),
}))

describe('firebase-admin module', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.clearAllMocks()
  })

  describe('getFirebaseAdmin', () => {
    it('returns null when FIREBASE_PROJECT_ID is not set', async () => {
      delete process.env.FIREBASE_PROJECT_ID
      delete process.env.FIREBASE_CLIENT_EMAIL
      delete process.env.FIREBASE_PRIVATE_KEY

      const { getFirebaseAdmin } = await import('../firebase-admin')
      const result = getFirebaseAdmin()

      expect(result).toBeNull()
    })

    it('returns an app when all env vars are set', async () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project'
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com'
      process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN RSA PRIVATE KEY-----\\ntest\\n-----END RSA PRIVATE KEY-----'

      const { initializeApp, getApps, cert } = await import('firebase-admin/app')
      const mockApp = { name: 'test-app' }
      vi.mocked(getApps).mockReturnValue([])
      vi.mocked(cert).mockReturnValue({} as ReturnType<typeof cert>)
      vi.mocked(initializeApp).mockReturnValue(mockApp as ReturnType<typeof initializeApp>)

      const { getFirebaseAdmin } = await import('../firebase-admin')
      const result = getFirebaseAdmin()

      expect(result).toBe(mockApp)
      expect(initializeApp).toHaveBeenCalledTimes(1)
    })

    it('reuses existing app on second call (singleton)', async () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project'
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com'
      process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN RSA PRIVATE KEY-----\\ntest\\n-----END RSA PRIVATE KEY-----'

      const { initializeApp, getApps, cert } = await import('firebase-admin/app')
      const mockApp = { name: 'test-app' }
      vi.mocked(getApps).mockReturnValue([])
      vi.mocked(cert).mockReturnValue({} as ReturnType<typeof cert>)
      vi.mocked(initializeApp).mockReturnValue(mockApp as ReturnType<typeof initializeApp>)

      const { getFirebaseAdmin } = await import('../firebase-admin')
      getFirebaseAdmin()
      getFirebaseAdmin()

      // initializeApp called only once due to singleton pattern
      expect(initializeApp).toHaveBeenCalledTimes(1)
    })

    it('reuses existing app when getApps() returns a non-empty list', async () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project'
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com'
      process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN RSA PRIVATE KEY-----\\ntest\\n-----END RSA PRIVATE KEY-----'

      const { initializeApp, getApps } = await import('firebase-admin/app')
      const mockApp = { name: 'existing-app' }
      vi.mocked(getApps).mockReturnValue([mockApp as ReturnType<typeof initializeApp>])

      const { getFirebaseAdmin } = await import('../firebase-admin')
      const result = getFirebaseAdmin()

      expect(initializeApp).not.toHaveBeenCalled()
      expect(result).toBe(mockApp)
    })

    it('handles multiline private key by replacing \\\\n with newlines', async () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project'
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com'
      process.env.FIREBASE_PRIVATE_KEY = 'line1\\nline2\\nline3'

      const { initializeApp, getApps, cert } = await import('firebase-admin/app')
      vi.mocked(getApps).mockReturnValue([])
      vi.mocked(cert).mockReturnValue({} as ReturnType<typeof cert>)
      vi.mocked(initializeApp).mockReturnValue({} as ReturnType<typeof initializeApp>)

      const { getFirebaseAdmin } = await import('../firebase-admin')
      getFirebaseAdmin()

      expect(cert).toHaveBeenCalledWith(
        expect.objectContaining({
          privateKey: 'line1\nline2\nline3',
        })
      )
    })

    it('does not log any env var values (credential safety)', async () => {
      process.env.FIREBASE_PROJECT_ID = 'secret-project-id'
      process.env.FIREBASE_CLIENT_EMAIL = 'secret@email.com'
      process.env.FIREBASE_PRIVATE_KEY = 'SECRET_KEY'

      const { initializeApp, getApps, cert } = await import('firebase-admin/app')
      vi.mocked(getApps).mockReturnValue([])
      vi.mocked(cert).mockReturnValue({} as ReturnType<typeof cert>)
      vi.mocked(initializeApp).mockReturnValue({} as ReturnType<typeof initializeApp>)

      const consoleSpy = vi.spyOn(console, 'log')
      const consoleInfoSpy = vi.spyOn(console, 'info')

      const { getFirebaseAdmin } = await import('../firebase-admin')
      getFirebaseAdmin()

      const allLogCalls = [
        ...consoleSpy.mock.calls.map((c) => c.join(' ')),
        ...consoleInfoSpy.mock.calls.map((c) => c.join(' ')),
      ]

      for (const logLine of allLogCalls) {
        expect(logLine).not.toContain('secret-project-id')
        expect(logLine).not.toContain('secret@email.com')
        expect(logLine).not.toContain('SECRET_KEY')
      }

      consoleSpy.mockRestore()
      consoleInfoSpy.mockRestore()
    })
  })

  describe('getFirebaseMessaging', () => {
    it('returns null when env vars are not set', async () => {
      delete process.env.FIREBASE_PROJECT_ID

      const { getFirebaseMessaging } = await import('../firebase-admin')
      const result = getFirebaseMessaging()

      expect(result).toBeNull()
    })

    it('returns messaging instance when env vars are set', async () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project'
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com'
      process.env.FIREBASE_PRIVATE_KEY = 'test-key'

      const { initializeApp, getApps, cert } = await import('firebase-admin/app')
      const { getMessaging } = await import('firebase-admin/messaging')
      const mockApp = { name: 'test-app' }
      const mockMessaging = { send: vi.fn() }
      vi.mocked(getApps).mockReturnValue([])
      vi.mocked(cert).mockReturnValue({} as ReturnType<typeof cert>)
      vi.mocked(initializeApp).mockReturnValue(mockApp as ReturnType<typeof initializeApp>)
      vi.mocked(getMessaging).mockReturnValue(mockMessaging as unknown as ReturnType<typeof getMessaging>)

      const { getFirebaseMessaging } = await import('../firebase-admin')
      const result = getFirebaseMessaging()

      expect(result).toBe(mockMessaging)
      expect(getMessaging).toHaveBeenCalledWith(mockApp)
    })
  })
})
