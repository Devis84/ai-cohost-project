import { useId } from 'react'

export interface ToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  'data-testid'?: string
}

export function Toggle({
  label,
  checked,
  onChange,
  disabled = false,
  className = '',
  'data-testid': dataTestId,
}: ToggleProps) {
  const id = useId()

  const labelClasses = [
    'flex items-center justify-between gap-4 cursor-pointer select-none',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <label
      htmlFor={id}
      className={labelClasses}
      data-testid={dataTestId}
    >
      <span className="text-sm font-medium text-on-surface">{label}</span>

      <div className="relative shrink-0">
        {/* Hidden accessible checkbox — label association via htmlFor/id provides the accessible name */}
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        {/* Visual track */}
        <div
          aria-hidden="true"
          className={[
            'w-11 h-6 rounded-full transition-colors duration-200',
            checked ? 'bg-accent' : 'bg-outline/40',
          ].join(' ')}
        />
        {/* Visual thumb */}
        <div
          aria-hidden="true"
          className={[
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm',
            'transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </div>
    </label>
  )
}
