"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button, Card, Input } from "@/components/ui"

export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const redirect = searchParams.get("redirect") || "/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function login() {
    setError("")
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    router.push(redirect)
    router.refresh()
  }

  return (
    <Card variant="white" padding="p-8" border className="w-full max-w-md">
      <div className="mb-8">
        <div className="uppercase tracking-[0.3em] text-xs text-outline mb-4">
          AI CO-HOST
        </div>

        <h1 className="text-3xl font-bold mb-2">Login</h1>

        <p className="text-outline">Access your host dashboard.</p>
      </div>

      <div className="space-y-4">
        <Input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        />

        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") login()
          }}
        />

        {error && (
          <div className="bg-error/10 border border-error/20 text-error rounded-2xl p-4 text-sm">
            {error}
          </div>
        )}

        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={login}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Logging in..." : "Login"}
        </Button>

        <p className="text-center text-sm text-outline">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-primary font-medium hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </Card>
  )
}
