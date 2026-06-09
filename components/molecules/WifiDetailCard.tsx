'use client'

import { useState } from 'react'
import { Wifi, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui'

export interface WifiDetailCardProps {
  networkName?: string | null
  password?: string | null
}

export function WifiDetailCard({ networkName, password }: WifiDetailCardProps) {
  const [copied, setCopied] = useState(false)

  const displayName = networkName?.trim() || 'Not available'
  const displayPassword = password?.trim() || 'Not available'

  async function handleCopy() {
    const text = `Network: ${displayName} | Password: ${displayPassword}`

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: silent fail on insecure contexts
    }
  }

  return (
    <section
      id="wifi"
      className="relative overflow-hidden bg-primary text-on-primary rounded-[32px] p-6 md:p-8 shadow-2xl"
    >
      {/* Background watermark */}
      <Wifi
        size={180}
        className="absolute -right-6 -bottom-6 text-on-primary/5 pointer-events-none"
        strokeWidth={1}
      />

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="uppercase tracking-[0.3em] text-xs text-on-primary/40 mb-4">
              QUICK ACCESS
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-3 flex items-center gap-3">
              <Wifi size={28} /> WiFi
            </h2>
            <p className="text-on-primary/60 leading-relaxed max-w-2xl">
              Use these details to connect during your stay.
            </p>
          </div>

          <Button onClick={handleCopy} variant="secondary" size="lg">
            {copied ? (
              <span className="flex items-center gap-2">
                <Check size={18} /> Copied
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Copy size={18} /> Copy WiFi
              </span>
            )}
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-7">
          <div className="bg-on-primary/10 border border-on-primary/10 rounded-3xl p-5">
            <div className="text-on-primary/40 text-xs uppercase tracking-[0.2em] mb-2">
              Network
            </div>
            <div className="text-2xl font-bold break-words">{displayName}</div>
          </div>

          <div className="bg-on-primary/10 border border-on-primary/10 rounded-3xl p-5">
            <div className="text-on-primary/40 text-xs uppercase tracking-[0.2em] mb-2">
              Password
            </div>
            <div className="text-2xl font-bold break-words">{displayPassword}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
