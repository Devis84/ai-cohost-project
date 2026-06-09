import { HTMLAttributes, ReactNode } from 'react'

export type BadgeColor = 'default' | 'success' | 'error' | 'neutral' | 'warning'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor
  size?: BadgeSize
  children?: ReactNode
}

const COLOR_CLASSES: Record<BadgeColor, string> = {
  default: 'bg-accent/10 text-accent',
  success: 'bg-accent/10 text-accent',
  error: 'bg-error/10 text-error',
  neutral: 'bg-on-surface/10 text-on-surface',
  warning: 'bg-warning/10 text-warning',
}

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
}

export function Badge({
  color = 'default',
  size = 'md',
  className = '',
  children,
  ...rest
}: BadgeProps) {
  const base = 'inline-flex items-center font-medium rounded-full'

  const classes = [base, COLOR_CLASSES[color], SIZE_CLASSES[size], className]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  )
}
