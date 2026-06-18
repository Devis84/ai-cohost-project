import Link from 'next/link'

const FOOTER_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Login', href: '/login' },
  { label: 'Sign Up', href: '/signup' },
] as const

export function SaaSFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-outline/10 bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-on-surface"
        >
          AI Co-Host
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-6">
          {FOOTER_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-outline transition-colors hover:text-on-surface"
            >
              {label}
            </Link>
          ))}
        </nav>

        <p className="text-xs text-outline">
          &copy; {year} AI Co-Host. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
