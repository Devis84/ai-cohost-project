'use client'

import { type ReactNode, useState } from 'react'
import {
  Sofa, FileText, Car, Recycle, Snowflake, Droplets,
  UtensilsCrossed, Bus, MapPin, LogOut, Sparkles, ChevronDown,
} from 'lucide-react'
import type { Property, WelcomeBook } from '@/types/guest'
import { safeText, getWelcomeBook } from '@/types/guest'

type BookSection = {
  id: string
  icon: ReactNode
  title: string
  content: string
}

function buildSections(property: Property, wb: WelcomeBook): BookSection[] {
  const entries: Array<{ id: string; icon: ReactNode; title: string; value: string }> = [
    { id: 'amenities', icon: <Sofa size={20} />, title: 'Amenities', value: safeText(wb.amenities) || safeText(property.amenities) },
    { id: 'rules', icon: <FileText size={20} />, title: 'House Rules', value: safeText(wb.house_rules) || safeText(property.house_rules) },
    { id: 'parking', icon: <Car size={20} />, title: 'Parking', value: safeText(wb.parking) || safeText(property.parking_info) },
    { id: 'trash', icon: <Recycle size={20} />, title: 'Trash & Recycling', value: safeText(wb.trash) },
    { id: 'ac', icon: <Snowflake size={20} />, title: 'Air Conditioning', value: safeText(wb.ac) },
    { id: 'boiler', icon: <Droplets size={20} />, title: 'Hot Water / Boiler', value: safeText(wb.boiler) },
    { id: 'restaurants', icon: <UtensilsCrossed size={20} />, title: 'Restaurants & Bars', value: safeText(wb.restaurants) },
    { id: 'transport', icon: <Bus size={20} />, title: 'Transport', value: safeText(wb.transport) },
    { id: 'local-guide', icon: <MapPin size={20} />, title: 'Local Guide', value: safeText(wb.local_guide) || safeText(property.local_info) },
    { id: 'checkout', icon: <LogOut size={20} />, title: 'Checkout Notes', value: safeText(wb.checkout_notes) },
    { id: 'extra', icon: <Sparkles size={20} />, title: 'Extra Services & Notes', value: safeText(wb.extra_notes) },
  ]

  return entries
    .filter((entry) => entry.value.length > 0)
    .map(({ id, icon, title, value }) => ({ id, icon, title, content: value }))
}

function AccordionItem({ section }: { section: BookSection }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-surface-container-lowest border border-outline/20 rounded-[28px] shadow-md overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 p-5 md:p-6 text-left"
      >
        <div className="flex items-center gap-4">
          <span className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
            {section.icon}
          </span>
          <h3 className="text-lg font-bold text-on-surface">{section.title}</h3>
        </div>
        <ChevronDown
          size={20}
          className={[
            'text-outline transition-transform duration-300 flex-shrink-0',
            open ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>

      <div
        className={[
          'grid transition-all duration-300 ease-in-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        ].join(' ')}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 md:px-6 md:pb-6">
            <div className="bg-surface-container rounded-2xl p-5 whitespace-pre-line leading-relaxed text-on-surface/80 text-sm md:text-base">
              {section.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export interface GuestWelcomeBookProps {
  property: Property
}

export function GuestWelcomeBook({ property }: GuestWelcomeBookProps) {
  const welcomeBook = getWelcomeBook(property)
  const sections = buildSections(property, welcomeBook)

  if (sections.length === 0) {
    return null
  }

  return (
    <section id="welcome-book" className="space-y-6">
      <div>
        <div className="uppercase tracking-[0.3em] text-xs text-outline mb-3">WELCOME BOOK</div>
        <h2 className="text-3xl md:text-4xl font-black">Useful information for your stay</h2>
        <p className="text-outline mt-3 max-w-2xl">
          House rules, local recommendations and practical notes for a smooth stay.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {sections.map((section) => (
          <AccordionItem key={section.id} section={section} />
        ))}
      </div>
    </section>
  )
}
