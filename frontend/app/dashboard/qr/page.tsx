"use client"

import { useState } from "react"
import { QRCodeCanvas } from "qrcode.react"

export default function QRPage() {

  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState<string | null>(null)

  async function generateQR() {

    setLoading(true)

    try {

      const res = await fetch("/api/generate-checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          propertyId: "7a7ddf51-cab6-4182-b467-011d1fa7698d"
        })
      })

      const data = await res.json()

      console.log("QR response:", data)

      if (data.ok) {
        setUrl(data.url)
      } else {
        alert("QR generation failed")
      }

    } catch (err) {
      console.error(err)
      alert("Error generating QR")
    }

    setLoading(false)
  }

  return (

    <div style={{ padding: 40 }}>

      <h1>Generate Check-in QR</h1>

      <button
        onClick={generateQR}
        style={{
          padding: "12px 20px",
          background: "black",
          color: "white",
          border: "none",
          cursor: "pointer"
        }}
      >
        {loading ? "Generating..." : "Generate"}
      </button>

      {url && (

        <div style={{ marginTop: 40 }}>

          <h3>Scan this QR</h3>

          <QRCodeCanvas
            value={url}
            size={220}
          />

          <p style={{ marginTop: 20 }}>
            Check-in link:
          </p>

          <a href={url}>{url}</a>

        </div>

      )}

    </div>

  )
}