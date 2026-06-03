 "use client";

import { useEffect, useMemo, useState } from "react";

type HostProperty = {
  id: string;
  name: string;
};

const mockProperties: HostProperty[] = [
  {
    id: "1",
    name: "Maltese Maisonette",
  },
  {
    id: "2",
    name: "Bali Villa",
  },
  {
    id: "3",
    name: "Rome Apartment",
  },
];

export default function HostDashboard() {
  const [properties, setProperties] =
    useState<HostProperty[]>([]);

  const [selectedProperty, setSelectedProperty] =
    useState("");

  const [wifiName, setWifiName] =
    useState("");

  const [wifiPass, setWifiPass] =
    useState("");

  useEffect(() => {
    setProperties(mockProperties);
    setSelectedProperty(mockProperties[0]?.id || "");
  }, []);

  const selected = useMemo(() => {
    return properties.find(
      (property) => property.id === selectedProperty
    );
  }, [properties, selectedProperty]);

  async function copyWifiPassword() {
    try {
      if (!wifiPass) {
        alert("No WiFi password to copy");
        return;
      }

      await navigator.clipboard.writeText(wifiPass);
      alert("Password copied");
    } catch (error) {
      console.error("COPY WIFI ERROR:", error);
      alert("Unable to copy password");
    }
  }

  return (
    <div style={{ padding: 30, maxWidth: 700 }}>
      <h1>Dashboard</h1>

      <div style={{ marginTop: 20 }}>
        <h2>🏡 Property</h2>

        <select
          value={selectedProperty}
          onChange={(event) =>
            setSelectedProperty(event.target.value)
          }
          style={{
            width: "100%",
            padding: 10,
          }}
        >
          {properties.map((property) => (
            <option
              key={property.id}
              value={property.id}
            >
              {property.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: 30 }}>
        <h2>📶 WiFi</h2>

        <input
          placeholder="Network name"
          value={wifiName}
          onChange={(event) =>
            setWifiName(event.target.value)
          }
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 10,
          }}
        />

        <input
          placeholder="Password"
          value={wifiPass}
          onChange={(event) =>
            setWifiPass(event.target.value)
          }
          style={{
            width: "100%",
            padding: 10,
          }}
        />

        <button
          type="button"
          style={{ marginTop: 10 }}
          onClick={copyWifiPassword}
        >
          Copy WiFi
        </button>
      </div>

      <div style={{ marginTop: 40 }}>
        <strong>Selected:</strong>{" "}
        {selected?.name || "No property selected"}
      </div>
    </div>
  );
}