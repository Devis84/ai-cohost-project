import { HTMLAttributes, ReactNode } from 'react'

export type CardVariant = 'white' | 'sand'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: string
  border?: boolean
  children?: ReactNode
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  white: 'bg-surface-container-lowest shadow-xl',
  sand: 'bg-surface shadow-md',
}

export function Card({
  variant = 'white',
  padding = 'p-8',
  border = false,
  className = '',
  children,
  ...rest
}: CardProps) {
  const base = 'rounded-[32px]'
  const borderClass = border ? 'border border-outline/20' : ''

  const classes = [base, VARIANT_CLASSES[variant], padding, borderClass, className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}
