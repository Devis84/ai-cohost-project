export interface SuggestionChipProps {
  label: string
  onClick: () => void
  className?: string
}

export function SuggestionChip({ label, onClick, className = '' }: SuggestionChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center rounded-full px-4 py-2',
        'text-sm font-medium',
        'bg-accent/10 text-accent border border-accent/20',
        'hover:bg-accent/20 active:scale-[0.97]',
        'transition-all duration-200 cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label}
    </button>
  )
}
