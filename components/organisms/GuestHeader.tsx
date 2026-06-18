import { Bot } from 'lucide-react'

export interface GuestHeaderProps {
  propertyName?: string
}

export function GuestHeader({ propertyName }: GuestHeaderProps) {
  return (
    <header
      className={[
        'sticky top-0 z-40',
        'bg-background/80 backdrop-blur-lg',
        'border-b border-outline/10',
        'px-4 md:px-8 py-3',
      ].join(' ')}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={22} className="text-accent" />
          <span className="text-sm font-bold tracking-wide text-on-surface">AI Co-Host</span>
        </div>

        {propertyName && (
          <span className="text-sm text-outline truncate max-w-[200px]">{propertyName}</span>
        )}
      </div>
    </header>
  )
}
