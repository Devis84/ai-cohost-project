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
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" className={raleway.variable} suppressHydrationWarning>
      <body className="bg-background">
        {children}
      </body>
    </html>
  )
}
