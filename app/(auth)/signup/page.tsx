"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button, Card, Input } from "@/components/ui"

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSignup() {
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/callback?next=/dashboard`,
      },
    })

    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <Card variant="white" padding="p-8" border className="w-full max-w-md">
        <div className="mb-6">
          <div className="uppercase tracking-[0.3em] text-xs text-outline mb-4">
            AI CO-HOST
          </div>
          <h1 className="text-3xl font-bold mb-2">Check your email</h1>
          <p className="text-outline">
            We sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account.
          </p>
        </div>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => router.push("/login")}
          className="w-full"
        >
          Back to Login
        </Button>
      </Card>
    )
  }

  return (
    <Card variant="white" padding="p-8" border className="w-full max-w-md">
      <div className="mb-8">
        <div className="uppercase tracking-[0.3em] text-xs text-outline mb-4">
          AI CO-HOST
        </div>
        <h1 className="text-3xl font-bold mb-2">Create account</h1>
        <p className="text-outline">Start managing your properties with AI.</p>
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
        />

        <Input
          placeholder="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") handleSignup()
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
          onClick={handleSignup}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </Button>

        <p className="text-center text-sm text-outline">
          Already have an account?{" "}
          <a href="/login" className="text-primary font-medium hover:underline">
            Login
          </a>
        </p>
      </div>
    </Card>
  )
}
