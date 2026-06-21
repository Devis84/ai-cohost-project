import { getFirebaseMessaging } from './firebase-admin'

export interface NotificationPayload {
  title: string
  body: string
  data?: Record<string, string>
}

export interface NotificationResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface NotificationProvider {
  send(token: string, payload: NotificationPayload): Promise<NotificationResult>
  sendMulticast(tokens: string[], payload: NotificationPayload): Promise<NotificationResult[]>
}

function generateMockMessageId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export class MockNotificationProvider implements NotificationProvider {
  async send(_token: string, payload: NotificationPayload): Promise<NotificationResult> {
    const messageId = generateMockMessageId()
    // Intentional dev-only logging. Replace with a real provider in production.
    if (process.env.NODE_ENV !== 'production') {
      console.info('[MockNotificationProvider] send()', {
        title: payload.title,
        messageId,
      })
    }
    return { success: true, messageId }
  }

  async sendMulticast(
    tokens: string[],
    payload: NotificationPayload,
  ): Promise<NotificationResult[]> {
    // Intentional dev-only logging. Replace with a real provider in production.
    if (process.env.NODE_ENV !== 'production') {
      console.info('[MockNotificationProvider] sendMulticast()', {
        title: payload.title,
        tokenCount: tokens.length,
      })
    }
    return tokens.map(() => ({
      success: true,
      messageId: generateMockMessageId(),
    }))
  }
}

export class FirebaseNotificationProvider implements NotificationProvider {
  async send(token: string, payload: NotificationPayload): Promise<NotificationResult> {
    try {
      const messaging = getFirebaseMessaging()
      if (!messaging) {
        return { success: false, error: 'Firebase messaging is not initialized' }
      }

      const messageId = await messaging.send({
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
      })

      return { success: true, messageId }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown FCM error'
      return { success: false, error: errorMessage }
    }
  }

  async sendMulticast(
    tokens: string[],
    payload: NotificationPayload,
  ): Promise<NotificationResult[]> {
    try {
      const messaging = getFirebaseMessaging()
      if (!messaging) {
        return tokens.map(() => ({
          success: false,
          error: 'Firebase messaging is not initialized',
        }))
      }

      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
      })

      return response.responses.map((r) => {
        if (r.success) {
          return { success: true, messageId: r.messageId }
        }
        return {
          success: false,
          error: r.error?.message ?? 'FCM delivery failed',
        }
      })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown FCM error'
      return tokens.map(() => ({ success: false, error: errorMessage }))
    }
  }
}

export function getNotificationProvider(): NotificationProvider {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return new MockNotificationProvider()
  }
  return new FirebaseNotificationProvider()
}
