import type { ReactNode } from 'react'

export interface GlassChipProps {
  icon: ReactNode
  label: string
  className?: string
}

export function GlassChip({ icon, label, className = '' }: GlassChipProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full px-4 py-2',
        'text-sm font-medium',
        'bg-white/15 backdrop-blur-md border border-white/20',
        'text-white shadow-sm',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span>{label}</span>
    </span>
  )
}
