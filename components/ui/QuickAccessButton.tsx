import type { ReactNode } from 'react'

export interface QuickAccessButtonProps {
  icon: ReactNode
  label: string
  onClick?: () => void
  href?: string
  className?: string
}

export function QuickAccessButton({
  icon,
  label,
  onClick,
  href,
  className = '',
}: QuickAccessButtonProps) {
  const classes = [
    'flex flex-col items-center justify-center gap-2 rounded-2xl p-4',
    'bg-surface-container-lowest text-on-surface',
    'border border-outline/20 shadow-md',
    'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
    'transition-all duration-200 cursor-pointer',
    'text-sm font-semibold text-center',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (href) {
    return (
      <a href={href} className={classes}>
        <span className="text-accent">{icon}</span>
        <span>{label}</span>
      </a>
    )
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      <span className="text-accent">{icon}</span>
      <span>{label}</span>
    </button>
  )
}
