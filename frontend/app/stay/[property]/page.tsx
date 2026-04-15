"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

type PropertyInfo = {
  id: string
  property_id: string
  wifi: string
  checkin: string
  checkout: string
  parking: string
  restaurants: string
  transport: string | null
  house_rules: string
  emergency_contact: string
}

export default function StayPage() {
  const params = useParams()
  const propertyId = params.property as string

  const [info, setInfo] = useState<PropertyInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProperty() {
      try {
        const res = await fetch(`/api/property-info?property_id=${propertyId}`)
        const data = await res.json()
        setInfo(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (propertyId) {
      loadProperty()
    }
  }, [propertyId])

  if (loading) {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif" }}>
        Loading property...
      </div>
    )
  }

  if (!info) {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif" }}>
        Property not found
      </div>
    )
  }

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "40px auto",
        fontFamily: "sans-serif",
        lineHeight: 1.6,
      }}
    >
      <h1>🏡 Welcome</h1>

      <section style={{ marginTop: 30 }}>
        <h2>📶 WiFi</h2>
        <p>{info.wifi}</p>
      </section>

      <section style={{ marginTop: 30 }}>
        <h2>🕒 Check-in / Check-out</h2>
        <p>Check-in: {info.checkin}</p>
        <p>Check-out: {info.checkout}</p>
      </section>

      <section style={{ marginTop: 30 }}>
        <h2>🚗 Parking</h2>
        <p>{info.parking}</p>
      </section>

      <section style={{ marginTop: 30 }}>
        <h2>🍝 Restaurants nearby</h2>
        <p>{info.restaurants}</p>
      </section>

      <section style={{ marginTop: 30 }}>
        <h2>🚇 Transport</h2>
        <p>{info.transport ?? "No info available"}</p>
      </section>

      <section style={{ marginTop: 30 }}>
        <h2>📋 House Rules</h2>
        <pre style={{ whiteSpace: "pre-wrap" }}>{info.house_rules}</pre>
      </section>

      <section style={{ marginTop: 30 }}>
        <h2>🚨 Emergency</h2>
        <pre style={{ whiteSpace: "pre-wrap" }}>{info.emergency_contact}</pre>
      </section>
    </div>
  )
}