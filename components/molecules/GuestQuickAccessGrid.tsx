import { Wifi, Key, FileText, MapPin, AlertTriangle, Phone } from 'lucide-react'
import { QuickAccessButton } from '@/components/ui'

export interface GuestQuickAccessGridProps {
  hasWifi?: boolean
  hasCheckin?: boolean
  hasRules?: boolean
  hasLocalGuide?: boolean
  hasEmergency?: boolean
  hasHostPhone?: boolean
  onNavigate?: (section: string) => void
}

export function GuestQuickAccessGrid({
  hasWifi = true,
  hasCheckin = true,
  hasRules = true,
  hasLocalGuide = true,
  hasEmergency = true,
  hasHostPhone = false,
  onNavigate,
}: GuestQuickAccessGridProps) {
  const items = [
    { id: 'wifi', icon: <Wifi size={24} />, label: 'WiFi', show: hasWifi },
    { id: 'checkin', icon: <Key size={24} />, label: 'Check-in', show: hasCheckin },
    { id: 'rules', icon: <FileText size={24} />, label: 'House Rules', show: hasRules },
    { id: 'local-guide', icon: <MapPin size={24} />, label: 'Local Guide', show: hasLocalGuide },
    { id: 'emergency', icon: <AlertTriangle size={24} />, label: 'Emergency', show: hasEmergency },
    { id: 'contact-host', icon: <Phone size={24} />, label: 'Contact Host', show: hasHostPhone },
  ]

  const visibleItems = items.filter((item) => item.show)

  if (visibleItems.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-3">
      {visibleItems.map((item) => (
        <QuickAccessButton
          key={item.id}
          icon={item.icon}
          label={item.label}
          onClick={() => onNavigate?.(item.id)}
          href={`#${item.id}`}
        />
      ))}
    </div>
  )
}
