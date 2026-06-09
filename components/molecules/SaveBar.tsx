import { HTMLAttributes } from 'react'

export interface SaveBarProps extends HTMLAttributes<HTMLDivElement> {
  propertyName: string
  isSaving: boolean
  onSave: () => void
  className?: string
}

export function SaveBar({
  propertyName,
  isSaving,
  onSave,
  className = '',
  ...rest
}: SaveBarProps) {
  const displayName = propertyName.trim() || 'No property selected'
  const statusText = isSaving ? 'Saving...' : 'Changes are ready to be saved'

  const baseClasses =
    'fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl bg-primary text-on-primary rounded-3xl px-6 py-5 shadow-2xl z-50 flex items-center justify-between gap-4'

  const classes = [baseClasses, className].filter(Boolean).join(' ')

  return (
    <div className={classes} {...rest}>
      <div className="flex flex-col min-w-0">
        <span className="font-semibold text-on-primary truncate">{displayName}</span>
        <span className="text-sm text-on-primary/70">{statusText}</span>
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="shrink-0 bg-surface-container-lowest text-on-surface font-semibold px-6 py-3 rounded-2xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
      >
        Save
      </button>
    </div>
  )
}
