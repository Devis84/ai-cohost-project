 "use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import DashboardSection from "@/components/DashboardSection"

export default function PropertyPage() {

  const searchParams = useSearchParams()
  const propertyId = searchParams.get("id")

  const [wifi, setWifi] = useState("")
  const [checkin, setCheckin] = useState("")
  const [checkout, setCheckout] = useState("")
  const [parking, setParking] = useState("")
  const [restaurants, setRestaurants] = useState("")
  const [transport, setTransport] = useState("")
  const [houseRules, setHouseRules] = useState("")

  const [saving, setSaving] = useState(false)

  useEffect(() => {

    if (!propertyId) return

    async function loadData() {

      const res = await fetch(
        `/api/property-info?property_id=${propertyId}`
      )

      const data = await res.json()

      const row = Array.isArray(data)
        ? data[0]
        : data

      if (!row) return

      setWifi(row.wifi || "")
      setCheckin(row.checkin || "")
      setCheckout(row.checkout || "")
      setParking(row.parking || "")
      setRestaurants(row.restaurants || "")
      setTransport(row.transport || "")
      setHouseRules(row.house_rules || "")

    }

    loadData()

  }, [propertyId])

  async function saveProperty() {

    setSaving(true)

    await fetch("/api/save-property", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        property_id: propertyId,

        wifi,
        checkin,
        checkout,
        parking,
        restaurants,
        transport,

        house_rules: houseRules

      })

    })

    setSaving(false)

    alert("Property saved successfully!")

  }

  return (

    <div className="min-h-screen bg-[#f3f4f6]">

      {/* TOP BAR */}

      <div className="sticky top-0 z-50 backdrop-blur-2xl bg-white/80 border-b border-gray-200">

        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">

          <div>

            <div className="uppercase tracking-[0.25em] text-[11px] text-gray-400 font-semibold mb-2">

              PROPERTY MANAGEMENT

            </div>

            <h1 className="text-3xl font-bold text-gray-900">

              Property Settings

            </h1>

          </div>

          <button
            onClick={saveProperty}
            disabled={saving}
            className="bg-black text-white px-6 py-4 rounded-2xl font-semibold shadow-xl hover:opacity-90 transition disabled:opacity-50"
          >

            {saving
              ? "Saving..."
              : "Save Changes"}

          </button>

        </div>

      </div>

      {/* CONTENT */}

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* WIFI */}

        <DashboardSection
          title="WiFi"
          subtitle="Manage internet information for guests."
          icon="📶"
        >

          <div>

            <label className="block text-sm font-semibold text-gray-700 mb-3">

              WiFi Network & Password

            </label>

            <input
              value={wifi}
              onChange={(e)=>setWifi(e.target.value)}
              placeholder="Example: HomeWiFi / password123"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-black"
            />

          </div>

        </DashboardSection>

        {/* CHECK-IN */}

        <DashboardSection
          title="Check-in Information"
          subtitle="Configure self check-in instructions and timings."
          icon="🔑"
        >

          <div className="grid md:grid-cols-2 gap-6 mb-6">

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-3">

                Check-in Time

              </label>

              <input
                value={checkin}
                onChange={(e)=>setCheckin(e.target.value)}
                placeholder="15:00"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black"
              />

            </div>

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-3">

                Check-out Time

              </label>

              <input
                value={checkout}
                onChange={(e)=>setCheckout(e.target.value)}
                placeholder="10:00"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black"
              />

            </div>

          </div>

        </DashboardSection>

        {/* LOCAL INFO */}

        <DashboardSection
          title="Local Information"
          subtitle="Help guests navigate and enjoy the area."
          icon="📍"
        >

          <div className="space-y-6">

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-3">

                Parking

              </label>

              <textarea
                value={parking}
                onChange={(e)=>setParking(e.target.value)}
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black resize-none"
              />

            </div>

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-3">

                Restaurants

              </label>

              <textarea
                value={restaurants}
                onChange={(e)=>setRestaurants(e.target.value)}
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black resize-none"
              />

            </div>

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-3">

                Transport

              </label>

              <textarea
                value={transport}
                onChange={(e)=>setTransport(e.target.value)}
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black resize-none"
              />

            </div>

          </div>

        </DashboardSection>

        {/* HOUSE RULES */}

        <DashboardSection
          title="House Rules"
          subtitle="Define guest expectations and important rules."
          icon="📜"
        >

          <textarea
            value={houseRules}
            onChange={(e)=>setHouseRules(e.target.value)}
            rows={10}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black resize-none"
          />

        </DashboardSection>

        {/* SAVE BAR */}

        <div className="sticky bottom-6">

          <div className="bg-black text-white rounded-[32px] px-8 py-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-5">

            <div>

              <div className="text-xl font-bold mb-1">

                Ready to publish changes?

              </div>

              <div className="text-white/60">

                Updates will immediately appear on the guest welcome page.

              </div>

            </div>

            <button
              onClick={saveProperty}
              disabled={saving}
              className="bg-white text-black px-8 py-4 rounded-2xl font-semibold hover:opacity-90 transition disabled:opacity-50"
            >

              {saving
                ? "Saving..."
                : "Save Property"}

            </button>

          </div>

        </div>

      </div>

    </div>

  )

}