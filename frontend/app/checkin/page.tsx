"use client"

import { useEffect, useState } from "react"

export default function CheckinPage() {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get("token")

    console.log("TOKEN FROM URL:", t)

    setToken(t)
  }, [])

  useEffect(() => {
    if (!token) return

    const verify = async () => {
      try {
        console.log("SENDING TOKEN:", token)

        const res = await fetch("/api/verify-checkin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ token })
        })

        const data = await res.json()

        console.log("VERIFY RESPONSE:", data)

      } catch (err) {
        console.error("CHECKIN ERROR:", err)
      }
    }

    verify()
  }, [token])

  return <div>Check-in in progress...</div>
}