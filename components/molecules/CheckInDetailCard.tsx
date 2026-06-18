import { Key, MapPin, Clock, LogOut } from 'lucide-react'
import { Button } from '@/components/ui'

export interface CheckInDetailCardProps {
  address?: string | null
  lockboxCode?: string | null
  checkinTime?: string | null
  checkoutTime?: string | null
  checkinInstructions?: string | null
}

export function CheckInDetailCard({
  address,
  lockboxCode,
  checkinTime,
  checkoutTime,
  checkinInstructions,
}: CheckInDetailCardProps) {
  const mapUrl = address?.trim()
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`
    : null

  return (
    <section
      id="checkin"
      className="bg-surface-container-lowest text-on-surface rounded-[32px] border border-outline/20 shadow-xl p-6 md:p-8"
    >
      <h2 className="text-2xl md:text-3xl font-black mb-5 flex items-center gap-3">
        <Key size={24} className="text-accent" />
        Check-in Details
      </h2>

      <div className="space-y-4">
        {address?.trim() && (
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-outline mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs uppercase tracking-widest text-outline mb-1">Address</div>
              <div className="font-medium">{address.trim()}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {checkinTime?.trim() && (
            <div className="flex items-start gap-3">
              <Clock size={18} className="text-outline mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs uppercase tracking-widest text-outline mb-1">Check-in</div>
                <div className="font-medium">{checkinTime.trim()}</div>
              </div>
            </div>
          )}

          {checkoutTime?.trim() && (
            <div className="flex items-start gap-3">
              <LogOut size={18} className="text-outline mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs uppercase tracking-widest text-outline mb-1">Check-out</div>
                <div className="font-medium">{checkoutTime.trim()}</div>
              </div>
            </div>
          )}
        </div>

        {lockboxCode?.trim() && (
          <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4">
            <div className="text-xs uppercase tracking-widest text-accent mb-1">Lockbox Code</div>
            <div className="text-2xl font-black text-accent tracking-wider">
              {lockboxCode.trim()}
            </div>
          </div>
        )}

        {checkinInstructions?.trim() && (
          <div className="bg-surface-container rounded-2xl p-4">
            <div className="text-xs uppercase tracking-widest text-outline mb-2">
              Arrival Instructions
            </div>
            <div className="leading-relaxed whitespace-pre-line text-sm">
              {checkinInstructions.trim()}
            </div>
          </div>
        )}

        {mapUrl && (
          <a href={mapUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="primary" size="md">
              <span className="flex items-center gap-2">
                <MapPin size={16} /> Open Map
              </span>
            </Button>
          </a>
        )}
      </div>
    </section>
  )
}
