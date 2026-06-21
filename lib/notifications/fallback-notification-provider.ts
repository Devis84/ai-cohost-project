export interface DeliveryResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface FallbackNotificationProvider {
  sendSms(to: string, message: string): Promise<DeliveryResult>
  sendWhatsApp(to: string, message: string): Promise<DeliveryResult>
}

function generateMessageId(): string {
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Development-only fallback provider that logs outbound notifications to the
 * console instead of sending real SMS / WhatsApp messages.
 *
 * This class must NOT be used in production. Use `getFallbackNotificationProvider`
 * which enforces the environment guard, or wire in a real provider via DI.
 */
export class DevLogFallbackProvider implements FallbackNotificationProvider {
  async sendSms(to: string, message: string): Promise<DeliveryResult> {
    const messageId = generateMessageId()
    // Intentional dev-only logging. Replace with a real SMS provider in production.
    console.info('[DevLogFallbackProvider] sendSms()', { to, message, messageId })
    return { success: true, messageId }
  }

  async sendWhatsApp(to: string, message: string): Promise<DeliveryResult> {
    const messageId = generateMessageId()
    // Intentional dev-only logging. Replace with a real WhatsApp provider in production.
    console.info('[DevLogFallbackProvider] sendWhatsApp()', { to, message, messageId })
    return { success: true, messageId }
  }
}

/**
 * Returns the active fallback notification provider.
 *
 * In non-production environments this returns a `DevLogFallbackProvider` that
 * logs messages to the console.  In production the function throws so that a
 * real provider (Twilio, etc.) must be configured before deployment.
 */
export function getFallbackNotificationProvider(): FallbackNotificationProvider {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'No fallback notification provider is configured for production. ' +
        'Set up a real SMS/WhatsApp provider and wire it in via getFallbackNotificationProvider().',
    )
  }
  return new DevLogFallbackProvider()
}
