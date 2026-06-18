import Link from 'next/link'

export interface PricingCardProps {
  name: string
  price: string
  description: string
  features: string[]
  ctaLabel: string
  ctaHref: string
  highlighted?: boolean
}

export function PricingCard({
  name,
  price,
  description,
  features,
  ctaLabel,
  ctaHref,
  highlighted = false,
}: PricingCardProps) {
  const cardClasses = highlighted
    ? 'relative rounded-2xl bg-inverse-surface text-inverse-on-surface p-8 shadow-2xl ring-2 ring-accent scale-105'
    : 'relative rounded-2xl bg-surface-container-lowest p-8 shadow-md'

  const ctaClasses = highlighted
    ? 'block w-full rounded-full bg-accent py-3 text-center font-semibold text-on-accent transition-all duration-200 hover:shadow-lg'
    : 'block w-full rounded-full border border-outline/30 bg-transparent py-3 text-center font-semibold text-on-surface transition-all duration-200 hover:bg-surface-container-high hover:shadow-md'

  const featureColor = highlighted
    ? 'text-inverse-on-surface/70'
    : 'text-outline'

  const checkColor = highlighted
    ? 'text-accent'
    : 'text-accent'

  return (
    <div className={cardClasses}>
      {highlighted && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-xs font-semibold text-on-accent">
          Most Popular
        </div>
      )}

      <h3 className="mb-1 text-xl font-bold">{name}</h3>

      <p className={`mb-4 text-sm ${featureColor}`}>{description}</p>

      <div className="mb-6">
        <span className="text-4xl font-bold">{price}</span>
        {price !== 'Custom' && (
          <span className={`ml-1 text-sm ${featureColor}`}>/mo</span>
        )}
      </div>

      <ul className="mb-8 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <svg
              className={`mt-0.5 h-4 w-4 shrink-0 ${checkColor}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className={featureColor}>{feature}</span>
          </li>
        ))}
      </ul>

      <Link href={ctaHref} className={ctaClasses}>
        {ctaLabel}
      </Link>
    </div>
  )
}
