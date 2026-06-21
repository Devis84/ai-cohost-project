import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Raleway } from 'next/font/google'
import './globals.css'

const raleway = Raleway({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-raleway',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AI Co-Host',
  description: 'Premium AI Concierge for your property',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AI Co-Host',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" className={raleway.variable} suppressHydrationWarning>
      <head>
        {/* theme-color and apple-touch-icon are not covered by Next.js metadata API */}
        <meta name="theme-color" content="#1a1a2e" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="bg-background">
        {children}
      </body>
    </html>
  )
}
