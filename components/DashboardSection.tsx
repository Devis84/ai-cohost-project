import { HTMLAttributes, ReactNode } from 'react'

export type DashboardSectionVariant = 'default' | 'ai'

export interface DashboardSectionProps extends HTMLAttributes<HTMLElement> {
  title: string
  subtitle?: string
  icon?: string
  variant?: DashboardSectionVariant
  children: ReactNode
  className?: string
}

const ICON_BG: Record<DashboardSectionVariant, string> = {
  default: 'bg-surface-container-high',
  ai: 'bg-accent/10',
}

const OUTER_EXTRA: Record<DashboardSectionVariant, string> = {
  default: '',
  ai: 'border-accent/20',
}

export function DashboardSection({
  title,
  subtitle,
  icon,
  variant = 'default',
  children,
  className = '',
  ...rest
}: DashboardSectionProps) {
  const baseClasses =
    'rounded-[32px] bg-surface-container-lowest shadow-xl border overflow-hidden'

  const classes = [baseClasses, OUTER_EXTRA[variant], className]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={classes} {...(rest as HTMLAttributes<HTMLElement>)}>
      {/* HEADER */}
      <div className="p-8 border-b border-outline/20">
        <div className="flex items-start gap-5">
          {icon && (
            <div
              className={`w-16 h-16 rounded-3xl ${ICON_BG[variant]} flex items-center justify-center text-3xl shrink-0`}
            >
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-3xl font-bold text-on-surface mb-2">{title}</h2>
            {subtitle && (
              <p className="text-outline leading-relaxed max-w-2xl">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-8">{children}</div>
    </section>
  )
}
