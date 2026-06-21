import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/hooks/useNotificationSetup', () => ({
  useNotificationSetup: vi.fn(),
}))

import { useNotificationSetup } from '@/lib/hooks/useNotificationSetup'
import { NotificationSettings } from '@/components/organisms/NotificationSettings'

const mockHook = vi.mocked(useNotificationSetup)

function buildHookState(overrides: Partial<ReturnType<typeof useNotificationSetup>> = {}): ReturnType<typeof useNotificationSetup> {
  return {
    isSupported: true,
    isLoading: false,
    isRegistered: false,
    permissionStatus: 'default',
    error: null,
    deviceId: null,
    requestAndRegister: vi.fn().mockResolvedValue(undefined),
    unregister: vi.fn().mockResolvedValue(undefined),
    sendTestNotification: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('NotificationSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Render states ─────────────────────────────────────────────

  describe('rendering', () => {
    it('renders loading state', () => {
      mockHook.mockReturnValue(buildHookState({ isLoading: true }))
      render(<NotificationSettings />)
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('renders unsupported state when notifications not available', () => {
      mockHook.mockReturnValue(buildHookState({ isSupported: false }))
      render(<NotificationSettings />)
      expect(screen.getByText(/not supported/i)).toBeInTheDocument()
    })

    it('renders enable button when permission is default', () => {
      mockHook.mockReturnValue(buildHookState({ permissionStatus: 'default', isRegistered: false }))
      render(<NotificationSettings />)
      expect(screen.getByRole('button', { name: /enable notifications/i })).toBeInTheDocument()
    })

    it('renders enabled state when registered', () => {
      mockHook.mockReturnValue(buildHookState({
        isRegistered: true,
        permissionStatus: 'granted',
      }))
      render(<NotificationSettings />)
      expect(screen.getByText(/notifications enabled/i)).toBeInTheDocument()
    })

    it('renders denied state message when permission denied', () => {
      mockHook.mockReturnValue(buildHookState({
        permissionStatus: 'denied',
        isRegistered: false,
      }))
      render(<NotificationSettings />)
      expect(screen.getByText(/permission denied/i)).toBeInTheDocument()
    })

    it('renders test notification button when registered', () => {
      mockHook.mockReturnValue(buildHookState({
        isRegistered: true,
        permissionStatus: 'granted',
        deviceId: 'device-1',
      }))
      render(<NotificationSettings />)
      expect(screen.getByRole('button', { name: /send test notification/i })).toBeInTheDocument()
    })

    it('renders disable notifications button when registered', () => {
      mockHook.mockReturnValue(buildHookState({
        isRegistered: true,
        permissionStatus: 'granted',
        deviceId: 'device-1',
      }))
      render(<NotificationSettings />)
      expect(screen.getByRole('button', { name: /disable notifications/i })).toBeInTheDocument()
    })

    it('renders error message when error is set', () => {
      mockHook.mockReturnValue(buildHookState({ error: 'Something went wrong' }))
      render(<NotificationSettings />)
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })

    it('shows benefit explanation text before enable button', () => {
      mockHook.mockReturnValue(buildHookState({ permissionStatus: 'default' }))
      render(<NotificationSettings />)
      // The benefit explanation should appear somewhere above/near the button
      expect(screen.getByText(/get instant alerts/i)).toBeInTheDocument()
    })
  })

  // ── Interactions ──────────────────────────────────────────────

  describe('interactions', () => {
    it('calls requestAndRegister when enable button is clicked', async () => {
      const mockRequestAndRegister = vi.fn().mockResolvedValue(undefined)
      mockHook.mockReturnValue(buildHookState({
        requestAndRegister: mockRequestAndRegister,
      }))

      const user = userEvent.setup()
      render(<NotificationSettings />)

      await user.click(screen.getByRole('button', { name: /enable notifications/i }))

      expect(mockRequestAndRegister).toHaveBeenCalledOnce()
    })

    it('calls sendTestNotification when test button is clicked', async () => {
      const mockSendTest = vi.fn().mockResolvedValue(undefined)
      mockHook.mockReturnValue(buildHookState({
        isRegistered: true,
        permissionStatus: 'granted',
        deviceId: 'device-1',
        sendTestNotification: mockSendTest,
      }))

      const user = userEvent.setup()
      render(<NotificationSettings />)

      await user.click(screen.getByRole('button', { name: /send test notification/i }))

      expect(mockSendTest).toHaveBeenCalledOnce()
    })

    it('calls unregister when disable button is clicked', async () => {
      const mockUnregister = vi.fn().mockResolvedValue(undefined)
      mockHook.mockReturnValue(buildHookState({
        isRegistered: true,
        permissionStatus: 'granted',
        deviceId: 'device-1',
        unregister: mockUnregister,
      }))

      const user = userEvent.setup()
      render(<NotificationSettings />)

      await user.click(screen.getByRole('button', { name: /disable notifications/i }))

      expect(mockUnregister).toHaveBeenCalledOnce()
    })

    it('does not call requestAndRegister on initial render', () => {
      const mockRequestAndRegister = vi.fn()
      mockHook.mockReturnValue(buildHookState({
        requestAndRegister: mockRequestAndRegister,
      }))

      render(<NotificationSettings />)

      expect(mockRequestAndRegister).not.toHaveBeenCalled()
    })
  })

  // ── Permission states ─────────────────────────────────────────

  describe('permission state display', () => {
    it('shows "default" status label when permission is not yet requested', () => {
      mockHook.mockReturnValue(buildHookState({ permissionStatus: 'default' }))
      render(<NotificationSettings />)
      expect(screen.getByText(/not yet requested/i)).toBeInTheDocument()
    })

    it('shows "granted" status label when permission is granted', () => {
      mockHook.mockReturnValue(buildHookState({
        permissionStatus: 'granted',
        isRegistered: true,
      }))
      render(<NotificationSettings />)
      expect(screen.getByText(/granted/i)).toBeInTheDocument()
    })

    it('shows "denied" status label when permission is denied', () => {
      mockHook.mockReturnValue(buildHookState({ permissionStatus: 'denied' }))
      render(<NotificationSettings />)
      const deniedElements = screen.getAllByText(/denied/i)
      expect(deniedElements.length).toBeGreaterThanOrEqual(1)
    })
  })
})
