 /* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

type Property = {
  id: string;
  property_name: string;
  slug?: string | null;
  city?: string | null;
  country?: string | null;
  wifi_name?: string | null;
  wifi_password?: string | null;
};

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createWifiQrValue({
  wifiName,
  wifiPassword,
}: {
  wifiName?: string | null;
  wifiPassword?: string | null;
}) {
  const ssid = wifiName || "";
  const password = wifiPassword || "";

  return `WIFI:T:WPA;S:${ssid};P:${password};;`;
}

export default function DashboardQrPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [guestQr, setGuestQr] = useState("");
  const [wifiQr, setWifiQr] = useState("");
  const [copied, setCopied] = useState("");

  const selectedProperty = useMemo(() => {
    return properties.find(
      (property) => property.id === selectedPropertyId
    );
  }, [properties, selectedPropertyId]);

  const origin = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.location.origin;
  }, []);

  const propertySlug = useMemo(() => {
    if (!selectedProperty) {
      return "";
    }

    return (
      selectedProperty.slug ||
      createSlug(selectedProperty.property_name)
    );
  }, [selectedProperty]);

  const guestUrl = useMemo(() => {
    if (!origin || !propertySlug) {
      return "";
    }

    return `${origin}/guest/${propertySlug}`;
  }, [origin, propertySlug]);

  const nfcUrl = guestUrl;

  const wifiQrValue = useMemo(() => {
    if (!selectedProperty) {
      return "";
    }

    return createWifiQrValue({
      wifiName: selectedProperty.wifi_name,
      wifiPassword: selectedProperty.wifi_password,
    });
  }, [selectedProperty]);

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    if (!guestUrl) {
      setGuestQr("");
      return;
    }

    generateQr(guestUrl).then(setGuestQr);
  }, [guestUrl]);

  useEffect(() => {
    if (!wifiQrValue) {
      setWifiQr("");
      return;
    }

    generateQr(wifiQrValue).then(setWifiQr);
  }, [wifiQrValue]);

  async function loadProperties() {
    try {
      setLoading(true);

      const response = await fetch("/api/properties");
      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error || "Unable to load properties"
        );
      }

      const loadedProperties =
        (data.properties || []) as Property[];

      setProperties(loadedProperties);

      if (loadedProperties.length > 0) {
        setSelectedPropertyId(loadedProperties[0].id);
      }
    } catch (error) {
      console.error("LOAD PROPERTIES ERROR:", error);
      alert("Unable to load properties");
    } finally {
      setLoading(false);
    }
  }

  async function generateQr(value: string) {
    try {
      return await QRCode.toDataURL(value, {
        width: 720,
        margin: 2,
        errorCorrectionLevel: "H",
      });
    } catch (error) {
      console.error("QR GENERATION ERROR:", error);
      return "";
    }
  }

  async function copyToClipboard(value: string, label: string) {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);

      setTimeout(() => {
        setCopied("");
      }, 1800);
    } catch (error) {
      console.error("COPY ERROR:", error);
      alert("Unable to copy");
    }
  }

  function downloadQr(dataUrl: string, filename: string) {
    if (!dataUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    link.click();
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white px-6 py-10 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <div className="uppercase tracking-[0.3em] text-xs text-white/50 mb-4">
                AI CO-HOST PLATFORM
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Guest Access QR / NFC
              </h1>

              <p className="text-white/70 text-lg max-w-3xl leading-relaxed">
                Generate the smart guest access link, QR code and NFC-ready URL for each property.
                This connects the physical Wi-Fi Porter with the digital welcome book and AI Concierge.
              </p>
            </div>

            <a
              href="/dashboard"
              className="bg-white text-black rounded-2xl px-6 py-4 font-semibold hover:opacity-90 transition text-center"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
          <h2 className="text-2xl font-bold mb-6">
            🏡 Select Property
          </h2>

          {loading && (
            <div className="text-gray-500">
              Loading properties...
            </div>
          )}

          {!loading && properties.length === 0 && (
            <div className="text-gray-500">
              No properties found.
            </div>
          )}

          {!loading && properties.length > 0 && (
            <select
              value={selectedPropertyId}
              onChange={(event) =>
                setSelectedPropertyId(event.target.value)
              }
              className="w-full border border-gray-200 rounded-2xl p-4 bg-white"
            >
              {properties.map((property) => (
                <option
                  key={property.id}
                  value={property.id}
                >
                  {property.property_name}
                  {property.city ? ` — ${property.city}` : ""}
                </option>
              ))}
            </select>
          )}
        </section>

        {selectedProperty && (
          <>
            <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div>
                  <div className="uppercase tracking-[0.25em] text-xs text-gray-400 mb-3">
                    Smart Guest Access
                  </div>

                  <h2 className="text-3xl font-bold mb-3">
                    {selectedProperty.property_name}
                  </h2>

                  <p className="text-gray-500 leading-relaxed max-w-3xl">
                    This is the main link for the Wi-Fi Porter, NFC tag and QR code.
                    Guests will use it to open the welcome page with WiFi, house rules,
                    local guide, extra services and AI Concierge.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href={guestUrl}
                    target="_blank"
                    className="bg-black text-white rounded-2xl px-5 py-3 font-semibold hover:opacity-90 transition"
                  >
                    Open Guest Page
                  </a>

                  <button
                    onClick={() =>
                      copyToClipboard(guestUrl, "guest")
                    }
                    className="bg-gray-100 text-black rounded-2xl px-5 py-3 font-semibold hover:bg-gray-200 transition"
                  >
                    {copied === "guest"
                      ? "Copied!"
                      : "Copy Guest Link"}
                  </button>
                </div>
              </div>

              <div className="mt-6 bg-gray-50 border border-gray-100 rounded-3xl p-5">
                <div className="text-sm text-gray-400 mb-2">
                  Guest Page URL
                </div>

                <div className="font-mono text-sm break-all">
                  {guestUrl}
                </div>
              </div>

              <div className="mt-5 bg-gray-50 border border-gray-100 rounded-3xl p-5">
                <div className="text-sm text-gray-400 mb-2">
                  NFC-ready URL
                </div>

                <div className="font-mono text-sm break-all mb-4">
                  {nfcUrl}
                </div>

                <button
                  onClick={() =>
                    copyToClipboard(nfcUrl, "nfc")
                  }
                  className="bg-black text-white rounded-2xl px-5 py-3 font-semibold hover:opacity-90 transition"
                >
                  {copied === "nfc"
                    ? "Copied!"
                    : "Copy NFC Link"}
                </button>

                <p className="text-gray-500 text-sm mt-4 leading-relaxed">
                  Write this URL to the NFC tag using NFC Tools, NXP TagWriter or another NFC writing app.
                  Do not write localhost URLs to real NFC tags. Use the final deployed public URL.
                </p>
              </div>
            </section>

            <section className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
                <div className="uppercase tracking-[0.25em] text-xs text-gray-400 mb-3">
                  Main QR Code
                </div>

                <h2 className="text-2xl font-bold mb-3">
                  📘 Welcome Page QR
                </h2>

                <p className="text-gray-500 mb-6 leading-relaxed">
                  This is the main QR code for the physical Wi-Fi Porter.
                  It opens the guest welcome page and AI Concierge.
                </p>

                <div className="bg-gray-50 rounded-3xl border border-gray-100 p-6 flex items-center justify-center min-h-[360px]">
                  {guestQr ? (
                    <img
                      src={guestQr}
                      alt="Guest welcome page QR code"
                      className="w-full max-w-[320px] rounded-2xl"
                    />
                  ) : (
                    <div className="text-gray-400">
                      Generating QR...
                    </div>
                  )}
                </div>

                <button
                  onClick={() =>
                    downloadQr(
                      guestQr,
                      `${propertySlug}-guest-page-qr.png`
                    )
                  }
                  className="mt-6 w-full bg-black text-white rounded-2xl px-5 py-4 font-semibold hover:opacity-90 transition"
                >
                  Download Guest QR
                </button>
              </div>

              <div className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
                <div className="uppercase tracking-[0.25em] text-xs text-gray-400 mb-3">
                  Optional WiFi QR
                </div>

                <h2 className="text-2xl font-bold mb-3">
                  📶 Direct WiFi QR
                </h2>

                <p className="text-gray-500 mb-6 leading-relaxed">
                  Optional QR code for direct WiFi connection.
                  The main QR/NFC should still point to the guest welcome page.
                </p>

                <div className="space-y-3 mb-6 text-gray-700">
                  <p>
                    <strong>Network:</strong>{" "}
                    {selectedProperty.wifi_name || "Not available"}
                  </p>

                  <p>
                    <strong>Password:</strong>{" "}
                    {selectedProperty.wifi_password || "Not available"}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-3xl border border-gray-100 p-6 flex items-center justify-center min-h-[360px]">
                  {wifiQr ? (
                    <img
                      src={wifiQr}
                      alt="WiFi QR code"
                      className="w-full max-w-[320px] rounded-2xl"
                    />
                  ) : (
                    <div className="text-gray-400">
                      Generating WiFi QR...
                    </div>
                  )}
                </div>

                <button
                  onClick={() =>
                    downloadQr(
                      wifiQr,
                      `${propertySlug}-wifi-qr.png`
                    )
                  }
                  className="mt-6 w-full bg-black text-white rounded-2xl px-5 py-4 font-semibold hover:opacity-90 transition"
                >
                  Download WiFi QR
                </button>
              </div>
            </section>

            <section className="bg-black text-white rounded-[32px] p-8 shadow-2xl">
              <div className="uppercase tracking-[0.25em] text-xs text-white/40 mb-4">
                Wi-Fi Porter Preview
              </div>

              <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-center">
                <div>
                  <h2 className="text-4xl font-bold mb-4">
                    Welcome 👋
                  </h2>

                  <p className="text-2xl font-semibold mb-3">
                    Your smart stay guide is ready
                  </p>

                  <p className="text-white/60 text-lg leading-relaxed max-w-2xl">
                    Tap or scan to access WiFi, welcome book, house rules,
                    local tips, extra services and the AI Concierge.
                  </p>

                  <div className="flex flex-wrap gap-3 mt-8">
                    <div className="bg-white/10 border border-white/10 rounded-full px-5 py-3 text-sm">
                      📶 WiFi
                    </div>

                    <div className="bg-white/10 border border-white/10 rounded-full px-5 py-3 text-sm">
                      📘 Welcome Book
                    </div>

                    <div className="bg-white/10 border border-white/10 rounded-full px-5 py-3 text-sm">
                      🤖 AI Concierge
                    </div>

                    <div className="bg-white/10 border border-white/10 rounded-full px-5 py-3 text-sm">
                      📍 Local Guide
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 flex items-center justify-center">
                  {guestQr ? (
                    <img
                      src={guestQr}
                      alt="Wi-Fi Porter guest QR preview"
                      className="w-full rounded-2xl"
                    />
                  ) : (
                    <div className="text-gray-400">
                      QR preview
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}