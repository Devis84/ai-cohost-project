'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const redirect = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const login = () => {
    setError('')

    if (
      email === process.env.NEXT_PUBLIC_ADMIN_EMAIL &&
      password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD
    ) {
      document.cookie =
        'ai_cohost_auth=true; path=/; max-age=86400; SameSite=Lax'

      router.push(redirect)
      return
    }

    setError('Invalid email or password')
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4">

      <div className="bg-white rounded-[32px] shadow-xl border border-black/5 p-8 w-full max-w-md">

        <div className="mb-8">

          <div className="uppercase tracking-[0.3em] text-xs text-gray-400 mb-4">
            AI CO-HOST
          </div>

          <h1 className="text-3xl font-bold mb-2">
            Login
          </h1>

          <p className="text-gray-500">
            Access your host dashboard.
          </p>

        </div>

        <div className="space-y-4">

          <input
            className="w-full border border-gray-200 rounded-2xl p-4"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full border border-gray-200 rounded-2xl p-4"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={login}
            className="w-full bg-black text-white rounded-2xl p-4 font-semibold hover:opacity-90 transition"
          >
            Login
          </button>

        </div>

      </div>

    </div>
  )
}