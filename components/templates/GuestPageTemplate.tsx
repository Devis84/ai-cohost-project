'use client'

import { useState } from 'react'
import { AlertTriangle, MessageCircle } from 'lucide-react'
import type { Property, ChatMessage } from '@/types/guest'
import { safeText, getPropertyName, getWelcomeBook } from '@/types/guest'
import { Card } from '@/components/ui'
import { GuestHeader } from '@/components/organisms/GuestHeader'
import { GuestHero } from '@/components/organisms/GuestHero'
import { GuestConcierge } from '@/components/organisms/GuestConcierge'
import { GuestWelcomeBook } from '@/components/organisms/GuestWelcomeBook'
import { GuestQuickAccessGrid } from '@/components/molecules/GuestQuickAccessGrid'
import { WifiDetailCard } from '@/components/molecules/WifiDetailCard'
import { CheckInDetailCard } from '@/components/molecules/CheckInDetailCard'
import { GuestMobileNav } from '@/components/molecules/GuestMobileNav'

export interface GuestPageTemplateProps {
  property: Property
}

export function GuestPageTemplate({ property }: GuestPageTemplateProps) {
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeTab, setActiveTab] = useState('home')

  const propertyName = getPropertyName(property)
  const welcomeBook = getWelcomeBook(property)
  const emergency =
    safeText(welcomeBook.emergency) ||
    safeText(property.emergency_info) ||
    safeText(property.emergency_numbers)

  async function sendMessage(messageOverride?: string) {
    const message = (messageOverride ?? chatInput).trim()

    if (!message || !property) {
      return
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
    }

    setMessages((current) => [...current, userMessage])
    setChatInput('')
    setChatLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          propertySlug: property.slug,
          propertyId: property.id,
          conversationId: `guest_${property.slug}`,
          channel: 'guest_portal',
        }),
      })

      const data = await response.json()

      const reply =
        data.reply ||
        'Sorry, I could not answer right now. The host has been notified if this is urgent.'

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: reply,
      }

      setMessages((current) => [...current, assistantMessage])
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content:
            'Sorry, I could not answer right now. Please contact the host if this is urgent.',
        },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface pb-20 md:pb-0">
      <GuestHeader propertyName={propertyName} />
      <GuestHero property={property} />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-7 md:space-y-8">
        {/* Quick access grid */}
        <GuestQuickAccessGrid
          hasWifi={Boolean(safeText(property.wifi_name))}
          hasCheckin={Boolean(
            safeText(property.lockbox_code) || safeText(property.checkin_instructions)
          )}
          hasRules={Boolean(
            safeText(welcomeBook.house_rules) || safeText(property.house_rules)
          )}
          hasLocalGuide={Boolean(
            safeText(welcomeBook.local_guide) || safeText(property.local_info)
          )}
          hasEmergency={Boolean(emergency)}
          hasHostPhone={Boolean(safeText(property.host_phone))}
        />

        {/* WiFi card */}
        <WifiDetailCard
          networkName={property.wifi_name}
          password={property.wifi_password}
        />

        {/* Check-in + Emergency row */}
        <div className="grid lg:grid-cols-2 gap-6">
          <CheckInDetailCard
            address={property.address}
            lockboxCode={property.lockbox_code}
            checkinTime={property.checkin_time}
            checkoutTime={property.checkout_time}
            checkinInstructions={property.checkin_instructions}
          />

          <div className="space-y-6">
            {/* Emergency card */}
            {emergency && (
              <Card variant="white" border padding="p-6 md:p-8" className="border-error/20">
                <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-3">
                  <AlertTriangle size={22} className="text-error" />
                  <span>Emergency</span>
                </h2>
                <div className="leading-relaxed whitespace-pre-line text-sm md:text-base">
                  {emergency}
                </div>
              </Card>
            )}

            {/* Help card */}
            <Card variant="white" border padding="p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-3">
                <MessageCircle size={22} className="text-accent" />
                <span>Need help?</span>
              </h2>
              <p className="text-on-surface/70 mb-4 text-sm md:text-base">
                Ask the AI Concierge for quick answers about the apartment, WiFi, parking, rules,
                restaurants, transport and checkout.
              </p>
              <a
                href="#ai-concierge"
                className="inline-flex bg-primary text-on-primary rounded-2xl px-5 py-3 font-semibold text-sm hover:shadow-lg transition-shadow"
              >
                Ask AI Concierge
              </a>
            </Card>
          </div>
        </div>

        {/* AI Concierge */}
        <GuestConcierge
          messages={messages}
          chatInput={chatInput}
          chatLoading={chatLoading}
          onInputChange={setChatInput}
          onSend={sendMessage}
        />

        {/* Welcome Book */}
        <GuestWelcomeBook property={property} />
      </main>

      {/* Mobile bottom nav */}
      <GuestMobileNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
