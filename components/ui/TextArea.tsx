import { TextareaHTMLAttributes, useId } from 'react'

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  minHeight?: string
}

export function TextArea({
  label,
  error,
  id: idProp,
  className = '',
  minHeight = 'min-h-[180px]',
  required,
  disabled,
  ...rest
}: TextAreaProps) {
  const generatedId = useId()
  const id = idProp ?? generatedId

  const base =
    'w-full rounded-2xl border border-outline/40 px-4 py-3 text-on-surface bg-white ' +
    'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent ' +
    'disabled:opacity-50 disabled:cursor-not-allowed ' +
    'transition-shadow duration-200 placeholder:text-outline resize-y'

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-on-surface">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <textarea
        id={id}
        required={required}
        disabled={disabled}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={[base, minHeight, className].filter(Boolean).join(' ')}
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
