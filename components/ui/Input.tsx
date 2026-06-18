import { InputHTMLAttributes, useId } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({
  label,
  error,
  id: idProp,
  className = '',
  required,
  disabled,
  ...rest
}: InputProps) {
  const generatedId = useId()
  const id = idProp ?? generatedId

  const base =
    'w-full min-h-[56px] rounded-2xl border border-outline/40 px-4 py-3 text-on-surface bg-white ' +
    'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent ' +
    'disabled:opacity-50 disabled:cursor-not-allowed ' +
    'transition-shadow duration-200 placeholder:text-outline'

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-on-surface">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <input
        id={id}
        required={required}
        disabled={disabled}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={[base, className].filter(Boolean).join(' ')}
        {...rest}
      />
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
