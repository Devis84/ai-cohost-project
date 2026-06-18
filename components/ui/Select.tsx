import { SelectHTMLAttributes, useId } from 'react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[]
  placeholder?: string
  label?: string
  error?: string
}

export function Select({
  options,
  placeholder,
  label,
  error,
  id: idProp,
  className = '',
  disabled,
  required,
  ...rest
}: SelectProps) {
  const generatedId = useId()
  const id = idProp ?? generatedId

  const base =
    'w-full rounded-2xl border border-outline/40 p-4 bg-white text-on-surface ' +
    'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent ' +
    'disabled:opacity-50 disabled:cursor-not-allowed ' +
    'transition-shadow duration-200 appearance-none cursor-pointer'

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-on-surface">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={[base, className].filter(Boolean).join(' ')}
          {...rest}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {/* Chevron icon */}
        <div
          className="pointer-events-none absolute inset-y-0 right-4 flex items-center"
          aria-hidden="true"
        >
          <svg
            className="w-4 h-4 text-outline"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
      {error && (
        <span
          id={`${id}-error`}
          role="alert"
          className="text-sm text-error"
        >
          {error}
        </span>
      )}
    </div>
  )
}
