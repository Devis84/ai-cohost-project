import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { FallbackNotificationProvider, DeliveryResult } from '../fallback-notification-provider'
import {
  DevLogFallbackProvider,
  getFallbackNotificationProvider,
} from '../fallback-notification-provider'

describe('FallbackNotificationProvider', () => {
  describe('DevLogFallbackProvider', () => {
    let provider: DevLogFallbackProvider
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    beforeEach(() => {
      provider = new DevLogFallbackProvider()
      vi.clearAllMocks()
    })

    afterEach(() => {
      vi.clearAllMocks()
    })

    it('satisfies the FallbackNotificationProvider interface', () => {
      expect(typeof provider.sendSms).toBe('function')
      expect(typeof provider.sendWhatsApp).toBe('function')
    })

    describe('sendSms', () => {
      it('returns success result', async () => {
        const result = await provider.sendSms('+15551234567', 'Test SMS message')

        expect(result.success).toBe(true)
      })

      it('returns a messageId in the result', async () => {
        const result = await provider.sendSms('+15551234567', 'Test')

        expect(result.messageId).toBeDefined()
        expect(typeof result.messageId).toBe('string')
        expect(result.messageId!.length).toBeGreaterThan(0)
      })

      it('logs the phone number and message to console', async () => {
        await provider.sendSms('+15551234567', 'Hello host')

        expect(consoleInfoSpy).toHaveBeenCalledWith(
          expect.stringContaining('[DevLogFallbackProvider]'),
          expect.objectContaining({
            to: '+15551234567',
            message: 'Hello host',
          }),
        )
      })

      it('handles empty message without throwing', async () => {
        const result = await provider.sendSms('+15551234567', '')

        expect(result.success).toBe(true)
      })

      it('handles unicode characters in message', async () => {
        const result = await provider.sendSms('+15551234567', 'Bonjour! 你好 🏠')

        expect(result.success).toBe(true)
      })

      it('does not throw on invalid phone number format', async () => {
        const result = await provider.sendSms('not-a-phone', 'Test')

        expect(result.success).toBe(true)
      })
    })

    describe('sendWhatsApp', () => {
      it('returns success result', async () => {
        const result = await provider.sendWhatsApp('+15551234567', 'Test WhatsApp message')

        expect(result.success).toBe(true)
      })

      it('returns a messageId in the result', async () => {
        const result = await provider.sendWhatsApp('+15551234567', 'Test')

        expect(result.messageId).toBeDefined()
        expect(typeof result.messageId).toBe('string')
        expect(result.messageId!.length).toBeGreaterThan(0)
      })

      it('logs the phone number and message to console', async () => {
        await provider.sendWhatsApp('+15551234567', 'WhatsApp message')

        expect(consoleInfoSpy).toHaveBeenCalledWith(
          expect.stringContaining('[DevLogFallbackProvider]'),
          expect.objectContaining({
            to: '+15551234567',
            message: 'WhatsApp message',
          }),
        )
      })

      it('handles empty message without throwing', async () => {
        const result = await provider.sendWhatsApp('+15551234567', '')

        expect(result.success).toBe(true)
      })

      it('generates unique messageIds across calls', async () => {
        const result1 = await provider.sendWhatsApp('+15551111111', 'Msg 1')
        const result2 = await provider.sendWhatsApp('+15552222222', 'Msg 2')

        expect(result1.messageId).not.toBe(result2.messageId)
      })
    })
  })

  describe('DeliveryResult type', () => {
    it('can represent a successful delivery with messageId', () => {
      const result: DeliveryResult = {
        success: true,
        messageId: 'msg-123',
      }

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('msg-123')
    })

    it('can represent a failed delivery with error', () => {
      const result: DeliveryResult = {
        success: false,
        error: 'Delivery failed',
      }

      expect(result.success).toBe(false)
      expect(result.error).toBe('Delivery failed')
    })
  })

  describe('getFallbackNotificationProvider', () => {
    it('returns a DevLogFallbackProvider instance', () => {
      const provider = getFallbackNotificationProvider()

      expect(provider).toBeInstanceOf(DevLogFallbackProvider)
    })

    it('returns provider with sendSms and sendWhatsApp methods', () => {
      const provider = getFallbackNotificationProvider()

      expect(typeof provider.sendSms).toBe('function')
      expect(typeof provider.sendWhatsApp).toBe('function')
    })
  })
})
