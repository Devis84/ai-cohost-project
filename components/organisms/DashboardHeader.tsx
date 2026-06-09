import { HTMLAttributes } from 'react'

export interface DashboardHeaderStat {
  label: string
  value: string
}

export interface DashboardHeaderProps extends HTMLAttributes<HTMLElement> {
  eyebrow?: string
  title: string
  description?: string
  stats?: DashboardHeaderStat[]
  className?: string
}

export function DashboardHeader({
  eyebrow,
  title,
  description,
  stats,
  className = '',
  ...rest
}: DashboardHeaderProps) {
  const baseClasses =
    'bg-gradient-to-br from-inverse-surface via-inverse-surface to-primary rounded-[32px] p-10 md:p-14'

  const classes = [baseClasses, className].filter(Boolean).join(' ')

  const hasStats = stats && stats.length > 0

  return (
    <header className={classes} {...(rest as HTMLAttributes<HTMLElement>)}>
      {/* EYEBROW */}
      {eyebrow && (
        <p className="uppercase tracking-[0.3em] text-xs text-on-primary/50 mb-4">
          {eyebrow}
        </p>
      )}

      {/* TITLE */}
      <h1 className="text-4xl md:text-5xl font-bold text-on-primary mb-4">{title}</h1>

      {/* DESCRIPTION */}
      {description && (
        <p className="text-on-primary/70 text-lg leading-relaxed max-w-2xl mb-8">
          {description}
        </p>
      )}

      {/* STATS */}
      {hasStats && (
        <div className="flex flex-wrap gap-4 mt-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-on-primary/10 border border-on-primary/15 backdrop-blur-xl rounded-[24px] p-5"
            >
              <div className="text-2xl font-bold text-on-primary">{stat.value}</div>
              <div className="text-xs text-on-primary/60 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </header>
  )
}
