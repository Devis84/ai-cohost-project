import { Wifi, Key, Bot } from 'lucide-react'
import { GlassChip, Button } from '@/components/ui'
import type { Property } from '@/types/guest'
import { safeText, getPropertyName } from '@/types/guest'

export interface GuestHeroProps {
  property: Property
}

export function GuestHero({ property }: GuestHeroProps) {
  const propertyName = getPropertyName(property)
  const city = safeText(property.city)
  const country = safeText(property.country)
  const hasWifi = Boolean(safeText(property.wifi_name))
  const hasCheckin = Boolean(safeText(property.lockbox_code) || safeText(property.checkin_instructions))
  const hasAi = property.ai_enabled !== false

  const locationLine = city && country ? `Welcome to ${city}` : city ? `Welcome to ${city}` : 'Welcome'

  const backgroundImage = safeText(property.image_url)

  return (
    <section
      id="top"
      className="relative overflow-hidden bg-inverse-surface text-on-primary"
    >
      {/* Background image with gradient overlay */}
      {backgroundImage ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-inverse-surface via-inverse-surface to-primary" />
      )}

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="uppercase tracking-[0.32em] text-[10px] md:text-[11px] text-on-primary/40 mb-4">
          AI CO-HOST EXPERIENCE
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-2">
          {locationLine}
        </h1>

        <p className="text-xl md:text-2xl font-medium text-on-primary/70 mb-6">
          {propertyName}
        </p>

        {/* Status chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {hasWifi && <GlassChip icon={<Wifi size={14} />} label="WiFi Active" />}
          {hasCheckin && <GlassChip icon={<Key size={14} />} label="Self Check-in" />}
          {hasAi && <GlassChip icon={<Bot size={14} />} label="AI Concierge Online" />}
        </div>

        {/* CTA */}
        <a href="#ai-concierge">
          <Button variant="ai-action" size="lg">
            <span className="flex items-center gap-2">
              <Bot size={20} /> Ask AI Concierge
            </span>
          </Button>
        </a>
      </div>
    </section>
  )
}
