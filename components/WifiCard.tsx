'use client'

import { useState } from 'react'

type Props = {
  wifiName?: string
  wifiPassword?: string
}

export default function WifiCard({
  wifiName,
  wifiPassword,
}: Props) {

  const [copied, setCopied] = useState(false)

  const copyPassword = async () => {

    if (!wifiPassword) return

    await navigator.clipboard.writeText(
      wifiPassword
    )

    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 2200)
  }

  return (

    <div className="relative bg-white rounded-[32px] p-8 shadow-xl border border-gray-100 overflow-hidden">

      {/* TOAST */}

      <div
        className={`absolute top-5 right-5 transition-all duration-300 ${
          copied
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >

        <div className="bg-black text-white px-4 py-3 rounded-2xl shadow-2xl text-sm font-medium">

          ✅ Password copied

        </div>

      </div>

      {/* HEADER */}

      <div className="flex items-center justify-between mb-8">

        <div className="flex items-center gap-4">

          <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center text-3xl">

            📶

          </div>

          <div>

            <h2 className="text-2xl font-bold text-gray-900">
              WiFi
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              High-speed internet
            </p>

          </div>

        </div>

        <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">

          Connected

        </div>

      </div>

      {/* NETWORK */}

      <div className="bg-gray-50 rounded-2xl p-5 mb-5">

        <div className="text-sm text-gray-500 mb-2">
          Network
        </div>

        <div className="font-semibold text-lg text-gray-900 break-all">

          {wifiName || 'N/A'}

        </div>

      </div>

      {/* PASSWORD */}

      <div className="bg-gray-50 rounded-2xl p-5 mb-6">

        <div className="text-sm text-gray-500 mb-2">
          Password
        </div>

        <div className="font-semibold text-lg text-gray-900 break-all">

          {wifiPassword || 'N/A'}

        </div>

      </div>

      {/* ACTION */}

      <button
        onClick={copyPassword}
        className="w-full bg-black text-white py-4 rounded-2xl font-semibold hover:opacity-90 transition-all duration-300 active:scale-[0.99]"
      >

        📋 Copy WiFi Password

      </button>

    </div>
  )
}