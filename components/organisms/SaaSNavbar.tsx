'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
] as const

export function SaaSNavbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-outline/10 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-on-surface"
        >
          AI Co-Host
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="text-sm font-medium text-outline transition-colors hover:text-on-surface"
            >
              {label}
            </a>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-full px-5 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-on-accent transition-all hover:shadow-lg"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-outline transition-colors hover:bg-surface-container-high md:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="border-t border-outline/10 bg-background px-4 pb-4 pt-2 md:hidden">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="block py-2 text-sm font-medium text-outline transition-colors hover:text-on-surface"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </a>
          ))}

          <div className="mt-3 flex flex-col gap-2">
            <Link
              href="/login"
              className="rounded-full border border-outline/20 py-2.5 text-center text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-accent py-2.5 text-center text-sm font-semibold text-on-accent transition-all hover:shadow-lg"
              onClick={() => setMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
