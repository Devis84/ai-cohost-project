import { PricingCard } from '@/components/molecules/PricingCard'

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started with one property.',
    features: [
      '1 property',
      'AI concierge',
      'Basic welcome book',
      'QR code generation',
      'Community support',
    ],
    ctaLabel: 'Get Started',
    ctaHref: '/signup',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    description: 'For professional hosts managing multiple properties.',
    features: [
      'Up to 10 properties',
      'Priority AI responses',
      'Full welcome book',
      'Issue tracking & alerts',
      'Cleaning module',
      'Email support',
    ],
    ctaLabel: 'Start Free Trial',
    ctaHref: '/signup?plan=pro',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For agencies and large-scale property managers.',
    features: [
      'Unlimited properties',
      'Custom AI training',
      'API access',
      'WhatsApp & Telegram',
      'Dedicated account manager',
      'SLA & priority support',
    ],
    ctaLabel: 'Contact Sales',
    ctaHref: '/contact',
    highlighted: false,
  },
] as const

export function SaaSPricingSection() {
  return (
    <section id="pricing" className="bg-background px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto max-w-xl text-base text-outline">
            Start free and scale as you grow. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="grid items-center gap-8 md:grid-cols-3">
          {TIERS.map((tier) => (
            <PricingCard
              key={tier.name}
              name={tier.name}
              price={tier.price}
              description={tier.description}
              features={[...tier.features]}
              ctaLabel={tier.ctaLabel}
              ctaHref={tier.ctaHref}
              highlighted={tier.highlighted}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
