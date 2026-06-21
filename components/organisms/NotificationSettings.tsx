'use client'

import { useNotificationSetup } from '@/lib/hooks/useNotificationSetup'

function StatusLabel({ status }: { status: 'default' | 'granted' | 'denied' }) {
  if (status === 'granted') {
    return (
      <span className="text-sm font-medium text-green-600">
        Granted
      </span>
    )
  }

  if (status === 'denied') {
    return (
      <span className="text-sm font-medium text-red-600">
        Denied
      </span>
    )
  }

  return (
    <span className="text-sm font-medium text-outline">
      Not yet requested
    </span>
  )
}

export function NotificationSettings() {
  const {
    isSupported,
    isLoading,
    isRegistered,
    permissionStatus,
    error,
    deviceId,
    requestAndRegister,
    unregister,
    sendTestNotification,
  } = useNotificationSetup()

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-outline/20 bg-surface-container-lowest p-6">
        <p className="text-outline text-sm">Loading notification settings...</p>
      </div>
    )
  }

  if (!isSupported) {
    return (
      <div className="rounded-2xl border border-outline/20 bg-surface-container-lowest p-6">
        <h3 className="font-semibold text-on-surface mb-2">Push Notifications</h3>
        <p className="text-sm text-outline">
          Push notifications are not supported in this browser.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-outline/20 bg-surface-container-lowest p-6 space-y-5">
      <div>
        <h3 className="font-semibold text-on-surface text-lg mb-1">
          Push Notifications
        </h3>
        <p className="text-sm text-outline">
          Permission status: <StatusLabel status={permissionStatus} />
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!isRegistered && permissionStatus !== 'denied' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
            <p className="text-sm text-blue-800 font-medium mb-1">
              Stay on top of guest requests
            </p>
            <p className="text-sm text-blue-700">
              Get instant alerts when a new guest request arrives so you can
              respond quickly and maintain top-rated service.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void requestAndRegister()}
            className="rounded-2xl bg-primary text-on-primary px-5 py-3 text-sm font-semibold hover:opacity-90 transition"
          >
            Enable Notifications
          </button>
        </div>
      )}

      {permissionStatus === 'denied' && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-sm text-amber-800 font-medium">Permission Denied</p>
          <p className="text-sm text-amber-700 mt-1">
            Notification permission has been blocked. To re-enable, update the
            site permissions in your browser settings and reload the page.
          </p>
        </div>
      )}

      {isRegistered && permissionStatus === 'granted' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-semibold text-on-surface">
              Notifications Enabled
            </span>
          </div>

          {deviceId && (
            <p className="text-xs text-outline font-mono break-all">
              Device: {deviceId}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={() => void sendTestNotification()}
              className="rounded-2xl bg-surface-container-high text-on-surface px-4 py-2 text-sm font-semibold hover:bg-surface-container-low transition"
            >
              Send Test Notification
            </button>

            <button
              type="button"
              onClick={() => void unregister()}
              className="rounded-2xl border border-outline/30 text-on-surface px-4 py-2 text-sm font-semibold hover:bg-surface-container-low transition"
            >
              Disable Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
