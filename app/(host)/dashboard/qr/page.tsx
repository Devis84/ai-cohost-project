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

function escapeWifiValue(value?: string | null) {
  return (value || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/:/g, "\\:");
}

function createWifiQrValue({
  wifiName,
  wifiPassword,
}: {
  wifiName?: string | null;
  wifiPassword?: string | null;
}) {
  const ssid = escapeWifiValue(wifiName);
  const password = escapeWifiValue(wifiPassword);
  return `WIFI:T:WPA;S:${ssid};P:${password};;`;
}

async function generateQr(value: string) {
  try {
    return await QRCode.toDataURL(value, {
      width: 900,
      margin: 2,
      errorCorrectionLevel: "H",
    });
  } catch (error) {
    console.error("QR GENERATION ERROR:", error);
    return "";
  }
}

function StatusPill({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={`rounded-full px-4 py-2 text-sm font-semibold border ${
        active
          ? "bg-emerald-50 text-emerald-800 border-emerald-100"
          : "bg-amber-50 text-amber-800 border-amber-100"
      }`}
    >
      {active ? "✅" : "⚠️"} {label}
    </div>
  );
}

function UseCaseCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-[28px] p-5 shadow-xl border border-black/5">
      <div className="text-3xl mb-4">{icon}</div>
      <div className="font-black text-lg mb-2">{title}</div>
      <div className="text-gray-500 text-sm leading-relaxed">{description}</div>
    </div>
  );
}

function UrlBox({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm text-gray-400 mb-2">{label}</div>
          <div className="font-mono text-sm break-all text-gray-900">
            {value || "Not available"}
          </div>
        </div>
        <button
          type="button"
          onClick={onCopy}
          disabled={!value}
          className="bg-black text-white rounded-2xl px-5 py-3 font-semibold hover:opacity-90 transition disabled:opacity-40"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export default function DashboardQrPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [guestQr, setGuestQr] = useState("");
  const [wifiQr, setWifiQr] = useState("");
  const [copied, setCopied] = useState("");

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === selectedPropertyId),
    [properties, selectedPropertyId]
  );

  const origin = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  const propertySlug = useMemo(() => {
    if (!selectedProperty) return "";
    return selectedProperty.slug || createSlug(selectedProperty.property_name);
  }, [selectedProperty]);

  const guestUrl = useMemo(() => {
    if (!origin || !propertySlug) return "";
    return `${origin}/guest/${propertySlug}`;
  }, [origin, propertySlug]);

  const nfcUrl = guestUrl;

  const propertyLocation = useMemo(() => {
    if (!selectedProperty) return "";
    return [selectedProperty.city, selectedProperty.country].filter(Boolean).join(", ");
  }, [selectedProperty]);

  const hasGuestAccess = Boolean(guestUrl && propertySlug);

  const hasWifiDetails = Boolean(
    selectedProperty?.wifi_name || selectedProperty?.wifi_password
  );

  const wifiQrValue = useMemo(() => {
    if (!selectedProperty) return "";
    return createWifiQrValue({
      wifiName: selectedProperty.wifi_name,
      wifiPassword: selectedProperty.wifi_password,
    });
  }, [selectedProperty]);

  useEffect(() => { loadProperties(); }, []);

  useEffect(() => {
    if (!guestUrl) { setGuestQr(""); return; }
    generateQr(guestUrl).then(setGuestQr);
  }, [guestUrl]);

  useEffect(() => {
    if (!wifiQrValue) { setWifiQr(""); return; }
    generateQr(wifiQrValue).then(setWifiQr);
  }, [wifiQrValue]);

  async function loadProperties() {
    try {
      setLoading(true);
      const response = await fetch("/api/properties");
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Unable to load properties");
      const loadedProperties = (data.properties || []) as Property[];
      setProperties(loadedProperties);
      if (loadedProperties.length > 0) setSelectedPropertyId(loadedProperties[0].id);
    } catch (error) {
      console.error("LOAD PROPERTIES ERROR:", error);
      alert("Unable to load properties");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(value: string, label: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(""), 1800);
    } catch (error) {
      console.error("COPY ERROR:", error);
      alert("Unable to copy");
    }
  }

  function downloadQr(dataUrl: string, filename: string) {
    if (!dataUrl) return;
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
              <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
                Guest Access QR / NFC
              </h1>
              <p className="text-white/70 text-lg max-w-3xl leading-relaxed">
                Create the physical access layer for each property: QR code,
                NFC-ready link, guest welcome page, WiFi details and AI
                Concierge access in one place.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/dashboard"
                className="bg-white text-black rounded-2xl px-6 py-4 font-semibold hover:opacity-90 transition text-center"
              >
                Back to Dashboard
              </a>

              {guestUrl && (
                <a
                  href={guestUrl}
                  target="_blank"
                  className="bg-white/10 border border-white/10 text-white rounded-2xl px-6 py-4 font-semibold hover:bg-white/15 transition text-center"
                >
                  Open Guest Page
                </a>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-10">
            <div className="bg-white/10 border border-white/10 rounded-3xl p-5">
              <div className="text-white/50 text-sm mb-2">Properties</div>
              <div className="text-3xl font-black">{properties.length}</div>
            </div>

            <div className="bg-white/10 border border-white/10 rounded-3xl p-5">
              <div className="text-white/50 text-sm mb-2">Selected</div>
              <div className="text-xl font-black truncate">
                {selectedProperty?.property_name || "None"}
              </div>
            </div>

            <div className="bg-white/10 border border-white/10 rounded-3xl p-5">
              <div className="text-white/50 text-sm mb-2">Guest Access</div>
              <div className="text-3xl font-black">
                {hasGuestAccess ? "READY" : "SETUP"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8 pb-20">
        <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
            <div>
              <div className="uppercase tracking-[0.25em] text-xs text-gray-400 mb-3">
                Select Property
              </div>
              <h2 className="text-3xl font-black mb-3">
                Choose the property to generate guest access
              </h2>
              <p className="text-gray-500 leading-relaxed max-w-3xl">
                The main QR/NFC link should point to the guest page, not only to WiFi.
                This gives guests a full welcome book, house rules, local guide and AI support.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <StatusPill
                label={hasGuestAccess ? "Guest link ready" : "Missing guest link"}
                active={hasGuestAccess}
              />
              <StatusPill
                label={hasWifiDetails ? "WiFi details found" : "WiFi optional"}
                active={hasWifiDetails}
              />
            </div>
          </div>

          <div className="mt-6">
            {loading && <div className="text-gray-500">Loading properties...</div>}

            {!loading && properties.length === 0 && (
              <div className="bg-amber-50 border border-amber-100 text-amber-900 rounded-3xl p-5">
                No properties found. Add a property first from the main dashboard.
              </div>
            )}

            {!loading && properties.length > 0 && (
              <select
                value={selectedPropertyId}
                onChange={(event) => setSelectedPropertyId(event.target.value)}
                className="w-full border border-gray-200 rounded-2xl p-4 bg-white font-semibold"
              >
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.property_name}
                    {property.city ? ` — ${property.city}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>
        </section>

        {selectedProperty && (
          <>
            <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div>
                  <div className="uppercase tracking-[0.25em] text-xs text-gray-400 mb-3">
                    Smart Guest Access
                  </div>
                  <h2 className="text-4xl font-black mb-3">
                    {selectedProperty.property_name}
                  </h2>
                  <p className="text-gray-500 leading-relaxed max-w-3xl">
                    This is the main public link for printed cards, QR stickers,
                    WiFi Porter displays and NFC tags. Guests scan or tap once and
                    land on the full digital stay experience.
                  </p>
                  {propertyLocation && (
                    <div className="mt-4 inline-flex bg-[#f4f1eb] border border-black/5 rounded-full px-4 py-2 text-sm font-semibold">
                      📍 {propertyLocation}
                    </div>
                  )}
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
                    onClick={() => copyToClipboard(guestUrl, "guest")}
                    className="bg-gray-100 text-black rounded-2xl px-5 py-3 font-semibold hover:bg-gray-200 transition"
                  >
                    {copied === "guest" ? "Copied!" : "Copy Guest Link"}
                  </button>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-5 mt-7">
                <UrlBox
                  label="Guest Page URL"
                  value={guestUrl}
                  copied={copied === "guest-url-box"}
                  onCopy={() => copyToClipboard(guestUrl, "guest-url-box")}
                />
                <UrlBox
                  label="NFC-ready URL"
                  value={nfcUrl}
                  copied={copied === "nfc"}
                  onCopy={() => copyToClipboard(nfcUrl, "nfc")}
                />
              </div>

              <div className="mt-5 bg-amber-50 border border-amber-100 rounded-3xl p-5">
                <div className="font-black text-amber-950 mb-2">NFC setup note</div>
                <p className="text-amber-900/70 text-sm leading-relaxed">
                  Write the NFC-ready URL to a physical NFC tag using NFC Tools,
                  NXP TagWriter or a similar app. Do not write localhost URLs to
                  real NFC tags. Always use the final deployed public URL.
                </p>
              </div>
            </section>

            <section className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
                <div className="uppercase tracking-[0.25em] text-xs text-gray-400 mb-3">
                  Main QR Code
                </div>
                <h2 className="text-3xl font-black mb-3">📘 Guest Welcome Page QR</h2>
                <p className="text-gray-500 mb-6 leading-relaxed">
                  This is the main QR code to print and place inside the property.
                  It opens the guest page with WiFi, stay guide, local tips and AI Concierge.
                </p>
                <div className="bg-gray-50 rounded-3xl border border-gray-100 p-6 flex items-center justify-center min-h-[380px]">
                  {guestQr ? (
                    <img
                      src={guestQr}
                      alt="Guest welcome page QR code"
                      className="w-full max-w-[330px] rounded-2xl"
                    />
                  ) : (
                    <div className="text-gray-400">Generating QR...</div>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-3 mt-6">
                  <button
                    onClick={() =>
                      downloadQr(guestQr, `${propertySlug}-guest-page-qr.png`)
                    }
                    className="bg-black text-white rounded-2xl px-5 py-4 font-semibold hover:opacity-90 transition"
                  >
                    Download Guest QR
                  </button>
                  <button
                    onClick={() => copyToClipboard(guestUrl, "guest-qr-copy")}
                    className="bg-gray-100 text-black rounded-2xl px-5 py-4 font-semibold hover:bg-gray-200 transition"
                  >
                    {copied === "guest-qr-copy" ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
                <div className="uppercase tracking-[0.25em] text-xs text-gray-400 mb-3">
                  Optional WiFi QR
                </div>
                <h2 className="text-3xl font-black mb-3">📶 Direct WiFi QR</h2>
                <p className="text-gray-500 mb-6 leading-relaxed">
                  Optional QR code for direct WiFi connection. Use this only as
                  a secondary QR. The main QR/NFC should point to the guest page.
                </p>
                <div className="space-y-3 mb-6 text-gray-700">
                  <div className="bg-[#f4f1eb] rounded-2xl p-4">
                    <strong>Network:</strong>{" "}
                    {selectedProperty.wifi_name || "Not available"}
                  </div>
                  <div className="bg-[#f4f1eb] rounded-2xl p-4">
                    <strong>Password:</strong>{" "}
                    {selectedProperty.wifi_password || "Not available"}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-3xl border border-gray-100 p-6 flex items-center justify-center min-h-[380px]">
                  {wifiQr ? (
                    <img
                      src={wifiQr}
                      alt="WiFi QR code"
                      className="w-full max-w-[330px] rounded-2xl"
                    />
                  ) : (
                    <div className="text-gray-400">Generating WiFi QR...</div>
                  )}
                </div>
                <button
                  onClick={() =>
                    downloadQr(wifiQr, `${propertySlug}-wifi-qr.png`)
                  }
                  className="mt-6 w-full bg-black text-white rounded-2xl px-5 py-4 font-semibold hover:opacity-90 transition"
                >
                  Download WiFi QR
                </button>
              </div>
            </section>

            <section className="bg-black text-white rounded-[32px] p-8 shadow-2xl">
              <div className="uppercase tracking-[0.25em] text-xs text-white/40 mb-4">
                WiFi Porter / Welcome Card Preview
              </div>
              <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-center">
                <div>
                  <h2 className="text-4xl md:text-5xl font-black mb-4">Welcome 👋</h2>
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
                    <div className="bg-white/10 border border-white/10 rounded-full px-5 py-3 text-sm">
                      🛎️ Guest Support
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-3xl p-5 flex items-center justify-center">
                  {guestQr ? (
                    <img
                      src={guestQr}
                      alt="WiFi Porter guest QR preview"
                      className="w-full rounded-2xl"
                    />
                  ) : (
                    <div className="text-gray-400">QR preview</div>
                  )}
                </div>
              </div>
            </section>

            <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <UseCaseCard
                icon="🖨️"
                title="Printed welcome cards"
                description="Print the main guest QR on a small card and place it near the entrance or bedside table."
              />
              <UseCaseCard
                icon="🏷️"
                title="QR stickers"
                description="Use QR stickers on a WiFi Porter, fridge magnet, desk card or inside the welcome book."
              />
              <UseCaseCard
                icon="📱"
                title="NFC tags"
                description="Write the guest URL to NFC tags so guests can tap their phone and open the stay guide."
              />
              <UseCaseCard
                icon="💬"
                title="Guest messages"
                description="Copy the guest URL and send it through Airbnb, WhatsApp or your pre-arrival message."
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
