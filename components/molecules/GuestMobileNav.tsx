import { Home, MapPin, Bot, User } from 'lucide-react'
import type { ReactNode } from 'react'

type NavTab = {
  id: string
  label: string
  icon: ReactNode
  href: string
}

const TABS: NavTab[] = [
  { id: 'home', label: 'Home', icon: <Home size={20} />, href: '#top' },
  { id: 'guide', label: 'Guide', icon: <MapPin size={20} />, href: '#welcome-book' },
  { id: 'concierge', label: 'Concierge', icon: <Bot size={20} />, href: '#ai-concierge' },
  { id: 'profile', label: 'Profile', icon: <User size={20} />, href: '#wifi' },
]

export interface GuestMobileNavProps {
  activeTab?: string
  onTabChange?: (tabId: string) => void
}

export function GuestMobileNav({ activeTab = 'home', onTabChange }: GuestMobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-primary/95 backdrop-blur-md border-t border-on-primary/10 px-2 py-1 safe-area-pb">
        <div className="grid grid-cols-4 gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id

            return (
              <a
                key={tab.id}
                href={tab.href}
                onClick={() => onTabChange?.(tab.id)}
                className={[
                  'flex flex-col items-center gap-1 rounded-2xl py-2 px-1',
                  'text-xs font-medium transition-all duration-200',
                  isActive
                    ? 'bg-surface-container-lowest text-on-surface'
                    : 'text-on-primary/60 hover:text-on-primary',
                ].join(' ')}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </a>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
