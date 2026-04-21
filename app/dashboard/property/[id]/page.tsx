"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

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

  useEffect(() => {

    if (!propertyId) return

    async function loadData() {

      const res = await fetch(`/api/property-info?property_id=${propertyId}`)
      const data = await res.json()

      const row = Array.isArray(data) ? data[0] : data

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

    alert("Property saved!")

  }


  return (

    <div style={{ maxWidth: 700, margin: "40px auto", fontFamily: "sans-serif" }}>

      <h1>Property Settings</h1>

      <div style={{ marginBottom: 20 }}>
        <label>Wifi</label>
        <input
          value={wifi}
          onChange={(e)=>setWifi(e.target.value)}
          style={{ width:"100%", padding:10 }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Check-in</label>
        <input
          value={checkin}
          onChange={(e)=>setCheckin(e.target.value)}
          style={{ width:"100%", padding:10 }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Check-out</label>
        <input
          value={checkout}
          onChange={(e)=>setCheckout(e.target.value)}
          style={{ width:"100%", padding:10 }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Parking</label>
        <input
          value={parking}
          onChange={(e)=>setParking(e.target.value)}
          style={{ width:"100%", padding:10 }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Restaurants</label>
        <input
          value={restaurants}
          onChange={(e)=>setRestaurants(e.target.value)}
          style={{ width:"100%", padding:10 }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Transport</label>
        <input
          value={transport}
          onChange={(e)=>setTransport(e.target.value)}
          style={{ width:"100%", padding:10 }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>House Rules</label>
        <textarea
          value={houseRules}
          onChange={(e)=>setHouseRules(e.target.value)}
          style={{ width:"100%", padding:10 }}
        />
      </div>

      <button
        style={{ padding:12 }}
        onClick={saveProperty}
      >
        Save
      </button>

    </div>

  )

}