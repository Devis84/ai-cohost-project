import { ReactNode } from 'react'

export type NavItemVariant = 'default' | 'danger'

interface NavItemBaseProps {
  label: string
  icon?: ReactNode
  isActive?: boolean
  variant?: NavItemVariant
  className?: string
}

interface NavItemLinkProps extends NavItemBaseProps {
  href: string
  onClick?: never
}

interface NavItemButtonProps extends NavItemBaseProps {
  href?: never
  onClick?: () => void
}

export type NavItemProps = NavItemLinkProps | NavItemButtonProps

const BASE_CLASSES =
  'w-full text-left px-5 py-4 rounded-2xl transition-all duration-200 inline-flex items-center gap-3'

const ACTIVE_CLASSES = 'bg-primary text-on-primary shadow-lg'

const VARIANT_CLASSES: Record<NavItemVariant, string> = {
  default: 'bg-surface-container-lowest border border-outline/30 text-on-surface',
  danger: 'bg-surface-container-lowest border border-error/20 text-error',
}

function buildClasses(
  variant: NavItemVariant,
  isActive: boolean,
  className: string
): string {
  const variantClass = isActive ? ACTIVE_CLASSES : VARIANT_CLASSES[variant]
  return [BASE_CLASSES, variantClass, className].filter(Boolean).join(' ')
}

export function NavItem({
  label,
  icon,
  isActive = false,
  href,
  onClick,
  variant = 'default',
  className = '',
}: NavItemProps): ReactNode {
  const classes = buildClasses(variant, isActive, className)

  const content = (
    <>
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{label}</span>
    </>
  )

  if (href) {
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    )
  }

  return (
    <button type="button" className={classes} onClick={onClick}>
      {content}
    </button>
  )
}
