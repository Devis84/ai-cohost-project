 "use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"

import DashboardSection from "@/components/DashboardSection"

type KnowledgeBase = {
  welcome_book?: {
    description?: string
    amenities?: string
    house_rules?: string
    parking?: string
    trash?: string
    ac?: string
    boiler?: string
    restaurants?: string
    transport?: string
    local_guide?: string
    emergency?: string
    checkout_notes?: string
    extra_notes?: string
  }
  ai_training?: {
    faq?: string
    troubleshooting?: string
    guest_style?: string
    hidden_notes?: string
    additional_notes?: string
  }
  [key: string]: unknown
}

type PropertyPayload = {
  property_name: string
  slug: string
  city: string
  country: string
  address: string
  wifi_name: string
  wifi_password: string
  checkin_time: string
  checkout_time: string
  checkin_instructions: string
  lockbox_code: string
  emergency_numbers: string
  contacts: string[]
  knowledge_base: KnowledgeBase
  ai_enabled: boolean
  whatsapp_enabled: boolean
  telegram_enabled: boolean
  welcomebook_enabled: boolean
}

const emptyKnowledgeBase: KnowledgeBase = {
  welcome_book: {
    description: "",
    amenities: "",
    house_rules: "",
    parking: "",
    trash: "",
    ac: "",
    boiler: "",
    restaurants: "",
    transport: "",
    local_guide: "",
    emergency: "",
    checkout_notes: "",
    extra_notes: "",
  },
  ai_training: {
    faq: "",
    troubleshooting: "",
    guest_style: "",
    hidden_notes: "",
    additional_notes: "",
  },
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function PropertyPage() {
  const params = useParams()

  const propertyId = useMemo(() => {
    const raw = params?.id

    if (Array.isArray(raw)) {
      return raw[0] || ""
    }

    return raw || ""
  }, [params])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [saveMessage, setSaveMessage] = useState("")

  const [propertyName, setPropertyName] = useState("")
  const [slug, setSlug] = useState("")

  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [address, setAddress] = useState("")

  const [wifiName, setWifiName] = useState("")
  const [wifiPassword, setWifiPassword] = useState("")

  const [checkinTime, setCheckinTime] = useState("")
  const [checkoutTime, setCheckoutTime] = useState("")
  const [checkinInstructions, setCheckinInstructions] =
    useState("")
  const [lockboxCode, setLockboxCode] = useState("")

  const [emergencyNumbers, setEmergencyNumbers] =
    useState("")
  const [contactsText, setContactsText] = useState("")

  const [description, setDescription] = useState("")
  const [amenities, setAmenities] = useState("")
  const [houseRules, setHouseRules] = useState("")
  const [parking, setParking] = useState("")
  const [restaurants, setRestaurants] = useState("")
  const [transport, setTransport] = useState("")
  const [checkoutNotes, setCheckoutNotes] = useState("")
  const [extraNotes, setExtraNotes] = useState("")

  const [faq, setFaq] = useState("")
  const [troubleshooting, setTroubleshooting] =
    useState("")
  const [guestStyle, setGuestStyle] = useState("")
  const [hiddenNotes, setHiddenNotes] = useState("")

  const [aiEnabled, setAiEnabled] = useState(true)
  const [whatsappEnabled, setWhatsappEnabled] =
    useState(false)
  const [telegramEnabled, setTelegramEnabled] =
    useState(false)
  const [welcomebookEnabled, setWelcomebookEnabled] =
    useState(true)

  useEffect(() => {
    if (!propertyId) return

    async function loadProperty() {
      try {
        setLoading(true)
        setLoadError("")

        const response = await fetch(
          `/api/properties/${encodeURIComponent(propertyId)}`
        )

        const data = await response.json()

        if (!response.ok || !data.property) {
          throw new Error(
            data.error || "Property not found"
          )
        }

        const property = data.property
        const knowledgeBase =
          property.knowledge_base || emptyKnowledgeBase

        const welcomeBook =
          knowledgeBase.welcome_book || {}

        const aiTraining =
          knowledgeBase.ai_training || {}

        setPropertyName(property.property_name || "")
        setSlug(property.slug || "")
        setCity(property.city || "")
        setCountry(property.country || "")
        setAddress(property.address || "")

        setWifiName(property.wifi_name || "")
        setWifiPassword(property.wifi_password || "")

        setCheckinTime(property.checkin_time || "")
        setCheckoutTime(property.checkout_time || "")
        setCheckinInstructions(
          property.checkin_instructions || ""
        )
        setLockboxCode(property.lockbox_code || "")

        setEmergencyNumbers(
          property.emergency_numbers || ""
        )

        setContactsText(
          Array.isArray(property.contacts)
            ? property.contacts.join("\n")
            : ""
        )

        setDescription(welcomeBook.description || "")
        setAmenities(welcomeBook.amenities || "")
        setHouseRules(
          welcomeBook.house_rules ||
            property.house_rules ||
            ""
        )
        setParking(welcomeBook.parking || "")
        setRestaurants(welcomeBook.restaurants || "")
        setTransport(welcomeBook.transport || "")
        setCheckoutNotes(
          welcomeBook.checkout_notes || ""
        )
        setExtraNotes(welcomeBook.extra_notes || "")

        setFaq(aiTraining.faq || "")
        setTroubleshooting(
          aiTraining.troubleshooting || ""
        )
        setGuestStyle(aiTraining.guest_style || "")
        setHiddenNotes(aiTraining.hidden_notes || "")

        setAiEnabled(property.ai_enabled ?? true)
        setWhatsappEnabled(
          property.whatsapp_enabled ?? false
        )
        setTelegramEnabled(
          property.telegram_enabled ?? false
        )
        setWelcomebookEnabled(
          property.welcomebook_enabled ?? true
        )
      } catch (error) {
        console.error(error)
        setLoadError(
          "Unable to load this property. Please go back to the dashboard and try again."
        )
      } finally {
        setLoading(false)
      }
    }

    loadProperty()
  }, [propertyId])

  async function saveProperty() {
    if (!propertyName.trim()) {
      alert("Property name is required")
      return
    }

    try {
      setSaving(true)
      setSaveMessage("")

      const finalSlug =
        slug.trim() || createSlug(propertyName)

      const contacts = contactsText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)

      const payload: PropertyPayload = {
        property_name: propertyName,
        slug: finalSlug,

        city,
        country,
        address,

        wifi_name: wifiName,
        wifi_password: wifiPassword,

        checkin_time: checkinTime,
        checkout_time: checkoutTime,
        checkin_instructions: checkinInstructions,
        lockbox_code: lockboxCode,

        emergency_numbers: emergencyNumbers,
        contacts,

        knowledge_base: {
          welcome_book: {
            description,
            amenities,
            house_rules: houseRules,
            parking,
            restaurants,
            transport,
            checkout_notes: checkoutNotes,
            extra_notes: extraNotes,
          },
          ai_training: {
            faq,
            troubleshooting,
            guest_style: guestStyle,
            hidden_notes: hiddenNotes,
          },
        },

        ai_enabled: aiEnabled,
        whatsapp_enabled: whatsappEnabled,
        telegram_enabled: telegramEnabled,
        welcomebook_enabled: welcomebookEnabled,
      }

      const response = await fetch(
        `/api/properties/${encodeURIComponent(propertyId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to save property"
        )
      }

      setSlug(finalSlug)
      setSaveMessage("Property saved successfully.")
    } catch (error) {
      console.error(error)
      alert("Error saving property")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">
            Loading property
          </div>
          <div className="text-gray-500">
            Please wait while we load the property data.
          </div>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 max-w-xl">
          <div className="text-2xl font-bold text-gray-900 mb-3">
            Property not available
          </div>
          <p className="text-gray-600 mb-6">
            {loadError}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex bg-black text-white px-6 py-4 rounded-2xl font-semibold"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <div className="sticky top-0 z-50 backdrop-blur-2xl bg-white/80 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <div className="uppercase tracking-[0.25em] text-[11px] text-gray-400 font-semibold mb-2">
              PROPERTY MANAGEMENT
            </div>

            <h1 className="text-3xl font-bold text-gray-900">
              Edit Property
            </h1>

            <div className="text-gray-500 mt-2">
              Manage the main guest-facing information for this property.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="bg-white border border-gray-200 text-gray-900 px-5 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition"
            >
              Back
            </Link>

            <button
              onClick={saveProperty}
              disabled={saving}
              className="bg-black text-white px-6 py-4 rounded-2xl font-semibold shadow-xl hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {saveMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-3xl px-6 py-4 font-medium">
            {saveMessage}
          </div>
        )}

        <DashboardSection
          title="General Information"
          subtitle="Core information used across the dashboard, guest portal and AI assistant."
          icon="🏠"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Property Name
              </label>
              <input
                value={propertyName}
                onChange={(event) =>
                  setPropertyName(event.target.value)
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Guest Portal Slug
              </label>
              <input
                value={slug}
                onChange={(event) =>
                  setSlug(event.target.value)
                }
                placeholder="sliema-apartment"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-black"
              />
              <div className="text-xs text-gray-400 mt-2">
                Used for /guest/slug and QR links.
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                City
              </label>
              <input
                value={city}
                onChange={(event) =>
                  setCity(event.target.value)
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Country
              </label>
              <input
                value={country}
                onChange={(event) =>
                  setCountry(event.target.value)
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Address
            </label>
            <textarea
              value={address}
              onChange={(event) =>
                setAddress(event.target.value)
              }
              rows={3}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-black resize-none"
            />
          </div>
        </DashboardSection>

        <DashboardSection
          title="WiFi"
          subtitle="Internet details shown to guests and used by the AI concierge."
          icon="📶"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                WiFi Network
              </label>
              <input
                value={wifiName}
                onChange={(event) =>
                  setWifiName(event.target.value)
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                WiFi Password
              </label>
              <input
                value={wifiPassword}
                onChange={(event) =>
                  setWifiPassword(event.target.value)
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
        </DashboardSection>

        <DashboardSection
          title="Check-in & Check-out"
          subtitle="Self check-in details, timing and access instructions."
          icon="🔑"
        >
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Check-in Time
              </label>
              <input
                value={checkinTime}
                onChange={(event) =>
                  setCheckinTime(event.target.value)
                }
                placeholder="15:00"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Check-out Time
              </label>
              <input
                value={checkoutTime}
                onChange={(event) =>
                  setCheckoutTime(event.target.value)
                }
                placeholder="10:00"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Lockbox Code
              </label>
              <input
                value={lockboxCode}
                onChange={(event) =>
                  setLockboxCode(event.target.value)
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Check-in Instructions
            </label>
            <textarea
              value={checkinInstructions}
              onChange={(event) =>
                setCheckinInstructions(event.target.value)
              }
              rows={5}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black resize-none"
            />
          </div>
        </DashboardSection>

        <DashboardSection
          title="Welcome Book"
          subtitle="Information shown to guests in the digital welcome experience."
          icon="📘"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Property Description
              </label>
              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Amenities
              </label>
              <textarea
                value={amenities}
                onChange={(event) =>
                  setAmenities(event.target.value)
                }
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                House Rules
              </label>
              <textarea
                value={houseRules}
                onChange={(event) =>
                  setHouseRules(event.target.value)
                }
                rows={5}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Parking
                </label>
                <textarea
                  value={parking}
                  onChange={(event) =>
                    setParking(event.target.value)
                  }
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
                  onChange={(event) =>
                    setRestaurants(event.target.value)
                  }
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
                  onChange={(event) =>
                    setTransport(event.target.value)
                  }
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Checkout Notes
                </label>
                <textarea
                  value={checkoutNotes}
                  onChange={(event) =>
                    setCheckoutNotes(event.target.value)
                  }
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black resize-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Extra Notes
              </label>
              <textarea
                value={extraNotes}
                onChange={(event) =>
                  setExtraNotes(event.target.value)
                }
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>
          </div>
        </DashboardSection>

        <DashboardSection
          title="AI Training"
          subtitle="Additional instructions used by the AI concierge."
          icon="🤖"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                FAQ
              </label>
              <textarea
                value={faq}
                onChange={(event) =>
                  setFaq(event.target.value)
                }
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Troubleshooting
              </label>
              <textarea
                value={troubleshooting}
                onChange={(event) =>
                  setTroubleshooting(event.target.value)
                }
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Guest Communication Style
              </label>
              <textarea
                value={guestStyle}
                onChange={(event) =>
                  setGuestStyle(event.target.value)
                }
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Internal / Hidden Notes
              </label>
              <textarea
                value={hiddenNotes}
                onChange={(event) =>
                  setHiddenNotes(event.target.value)
                }
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black resize-none"
              />
              <div className="text-xs text-gray-400 mt-2">
                These notes are for AI context only and should not be shown directly to guests.
              </div>
            </div>
          </div>
        </DashboardSection>

        <DashboardSection
          title="Emergency & Contacts"
          subtitle="Useful contact details for guests and the AI assistant."
          icon="☎️"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Emergency Numbers
              </label>
              <textarea
                value={emergencyNumbers}
                onChange={(event) =>
                  setEmergencyNumbers(event.target.value)
                }
                rows={6}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Contacts
              </label>
              <textarea
                value={contactsText}
                onChange={(event) =>
                  setContactsText(event.target.value)
                }
                rows={6}
                placeholder="One contact per line"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>
          </div>
        </DashboardSection>

        <DashboardSection
          title="Modules"
          subtitle="Enable or disable property-level modules."
          icon="⚙️"
        >
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                label: "AI Concierge",
                value: aiEnabled,
                onChange: setAiEnabled,
              },
              {
                label: "WhatsApp",
                value: whatsappEnabled,
                onChange: setWhatsappEnabled,
              },
              {
                label: "Telegram",
                value: telegramEnabled,
                onChange: setTelegramEnabled,
              },
              {
                label: "Welcome Book",
                value: welcomebookEnabled,
                onChange: setWelcomebookEnabled,
              },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() =>
                  item.onChange(!item.value)
                }
                className={`rounded-3xl border px-6 py-5 text-left transition ${
                  item.value
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-900 border-gray-200"
                }`}
              >
                <div className="font-bold mb-1">
                  {item.label}
                </div>
                <div
                  className={`text-sm ${
                    item.value
                      ? "text-white/60"
                      : "text-gray-500"
                  }`}
                >
                  {item.value ? "Enabled" : "Disabled"}
                </div>
              </button>
            ))}
          </div>
        </DashboardSection>

        <div className="sticky bottom-6">
          <div className="bg-black text-white rounded-[32px] px-8 py-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-5">
            <div>
              <div className="text-xl font-bold mb-1">
                Ready to save changes?
              </div>

              <div className="text-white/60">
                Updates will be available to the guest portal and AI assistant.
              </div>
            </div>

            <button
              onClick={saveProperty}
              disabled={saving}
              className="bg-white text-black px-8 py-4 rounded-2xl font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Property"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}