import Link from 'next/link'
import { Sparkles, Clock, Zap } from 'lucide-react'

const STATS = [
  { icon: <Sparkles size={18} />, label: '500+ Properties' },
  { icon: <Clock size={18} />, label: '24/7 AI Concierge' },
  { icon: <Zap size={18} />, label: '90% Faster Responses' },
] as const

export function SaaSHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-surface-container-low to-surface px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-accent/8 blur-3xl" />

      <div className="relative mx-auto max-w-4xl text-center">
        <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-on-surface sm:text-5xl lg:text-6xl">
          AI-Powered Hospitality,{' '}
          <span className="text-accent">Simplified</span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-outline sm:text-lg">
          Give your guests a 5-star digital concierge. Automate check-ins,
          answer questions 24/7, and manage issues — all from one dashboard.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-3.5 text-base font-semibold text-on-accent transition-all duration-200 hover:shadow-xl"
          >
            Get Started Free
          </Link>
          <a
            href="#features"
            className="inline-flex items-center justify-center rounded-full border border-outline/30 px-8 py-3.5 text-base font-semibold text-on-surface transition-all duration-200 hover:bg-surface-container-high hover:shadow-md"
          >
            See How It Works
          </a>
        </div>

        {/* Stats row */}
        <div className="mt-16 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
          {STATS.map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 text-sm font-medium text-outline"
            >
              <span className="text-accent">{icon}</span>
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
