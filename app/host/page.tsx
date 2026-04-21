"use client";

import { useEffect, useState } from "react";

export default function HostDashboard() {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [wifiName, setWifiName] = useState("");
  const [wifiPass, setWifiPass] = useState("");

  // MOCK (poi lo collegheremo a Supabase)
  useEffect(() => {
    const mock = [
      { id: "1", name: "Maltese Maisonette" },
      { id: "2", name: "Bali Villa" },
      { id: "3", name: "Rome Apartment" }
    ];

    setProperties(mock);
    setSelectedProperty(mock[0].id);
  }, []);

  const selected = properties.find(p => p.id === selectedProperty);

  return (
    <div style={{ padding: 30, maxWidth: 700 }}>
      <h1>Dashboard</h1>

      {/* PROPERTY */}
      <div style={{ marginTop: 20 }}>
        <h2>🏡 Property</h2>

        <select
          value={selectedProperty}
          onChange={(e) => setSelectedProperty(e.target.value)}
          style={{ width: "100%", padding: 10 }}
        >
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* WIFI */}
      <div style={{ marginTop: 30 }}>
        <h2>📶 WiFi</h2>

        <input
          placeholder="Network name"
          value={wifiName}
          onChange={(e) => setWifiName(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />

        <input
          placeholder="Password"
          value={wifiPass}
          onChange={(e) => setWifiPass(e.target.value)}
          style={{ width: "100%", padding: 10 }}
        />

        <button
          style={{ marginTop: 10 }}
          onClick={() => {
            navigator.clipboard.writeText(wifiPass);
            alert("Password copied");
          }}
        >
          Copy WiFi
        </button>
      </div>

      {/* DEBUG */}
      <div style={{ marginTop: 40 }}>
        <strong>Selected:</strong> {selected?.name}
      </div>
    </div>
  );
}
