"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function LogoutPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function logout() {
      await supabase.auth.signOut()
      router.replace("/login")
    }

    logout()
  }, [router, supabase.auth])

  return (
    <div className="text-center">
      <div className="uppercase tracking-[0.3em] text-xs text-outline mb-4">
        AI CO-HOST
      </div>
      <h1 className="text-3xl font-bold mb-3">Logging out</h1>
      <p className="text-outline">Please wait while we close your session.</p>
    </div>
  )
}