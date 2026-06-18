import { HTMLAttributes, ReactNode } from 'react'

export interface SmartAlertProps extends HTMLAttributes<HTMLDivElement> {
  message: string
  title?: string
  children?: ReactNode
}

export function SmartAlert({
  message,
  title,
  children,
  className = '',
  ...rest
}: SmartAlertProps) {
  const base =
    'border-l-4 border-accent bg-gradient-to-r from-accent/10 to-transparent ' +
    'rounded-r-2xl px-5 py-4'

  return (
    <div
      role="alert"
      className={[base, className].filter(Boolean).join(' ')}
      {...rest}
    >
      <div className="flex items-start gap-3">
        <span className="text-accent mt-0.5 shrink-0" aria-hidden="true">
          ✦
        </span>
        <div className="flex-1 min-w-0">
          {title && (
            <p className="font-semibold text-accent mb-1">{title}</p>
          )}
          <p className="text-on-surface text-sm">{message}</p>
          {children && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </div>
  )
}
