 "use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"

import DashboardSection from "@/components/DashboardSection"

type GuestPageContent = {
  hero_title?: string
  hero_intro?: string
  hero_image_url?: string
  about_title?: string
  about_intro?: string
  about_description?: string
  about_highlights?: string
}

type KnowledgeBase = {
  guest_page?: GuestPageContent
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
  extra_services?: {
    enabled?: boolean
    title?: string
    intro?: string
    services?: string
    host_note?: string
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
  guest_page: {
    hero_title: "",
    hero_intro: "",
    hero_image_url: "",
    about_title: "",
    about_intro: "",
    about_description: "",
    about_highlights: "",
  },
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
  extra_services: {
    enabled: false,
    title: "Extra Services",
    intro: "",
    services: "",
    host_note: "",
  },
  ai_training: {
    faq: "",
    troubleshooting: "",
    guest_style: "",
    hidden_notes: "",
    additional_notes: "",
  },
}

const malteseMaisonetteHeroImage =
  "/guest-images/maltese-maisonette-hero-bedroom.jpg"

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function splitHighlights(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
}

function CommandActionCard({
  icon,
  title,
  description,
  href,
  onClick,
  dark = false,
  disabled = false,
}: {
  icon: string
  title: string
  description: string
  href?: string
  onClick?: () => void
  dark?: boolean
  disabled?: boolean
}) {
  const className = `block w-full text-left rounded-3xl p-5 transition border ${
    dark
      ? "bg-black text-white border-black hover:opacity-90"
      : "bg-white text-gray-950 border-gray-200 hover:border-black/20 hover:shadow-lg"
  } ${disabled ? "opacity-50 pointer-events-none" : ""}`

  const content = (
    <>
      <div className="text-3xl mb-4">{icon}</div>

      <div className="font-black text-lg mb-2">
        {title}
      </div>

      <div
        className={`text-sm leading-relaxed ${
          dark ? "text-white/60" : "text-gray-500"
        }`}
      >
        {description}
      </div>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        target={href.startsWith("/guest") ? "_blank" : undefined}
        className={className}
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {content}
    </button>
  )
}

function StatusPill({
  label,
  value,
  active,
}: {
  label: string
  value: string
  active: boolean
}) {
  return (
    <div
      className={`rounded-3xl p-4 border ${
        active
          ? "bg-green-50 border-green-100 text-green-800"
          : "bg-gray-50 border-gray-100 text-gray-500"
      }`}
    >
      <div className="text-xs uppercase tracking-[0.2em] mb-2 opacity-60">
        {label}
      </div>

      <div className="text-xl font-black">
        {value}
      </div>
    </div>
  )
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

  const [heroTitle, setHeroTitle] = useState("")
  const [heroIntro, setHeroIntro] = useState("")
  const [heroImageUrl, setHeroImageUrl] = useState("")
  const [aboutTitle, setAboutTitle] = useState("")
  const [aboutIntro, setAboutIntro] = useState("")
  const [aboutDescription, setAboutDescription] =
    useState("")
  const [aboutHighlights, setAboutHighlights] =
    useState("")

  const [description, setDescription] = useState("")
  const [amenities, setAmenities] = useState("")
  const [houseRules, setHouseRules] = useState("")
  const [parking, setParking] = useState("")
  const [restaurants, setRestaurants] = useState("")
  const [transport, setTransport] = useState("")
  const [checkoutNotes, setCheckoutNotes] = useState("")
  const [extraNotes, setExtraNotes] = useState("")

  const [extraServicesEnabled, setExtraServicesEnabled] =
    useState(false)
  const [extraServicesTitle, setExtraServicesTitle] =
    useState("Extra Services")
  const [extraServicesIntro, setExtraServicesIntro] =
    useState("")
  const [extraServicesList, setExtraServicesList] =
    useState("")
  const [extraServicesHostNote, setExtraServicesHostNote] =
    useState("")

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

  const finalSlug = useMemo(() => {
    return slug.trim() || createSlug(propertyName)
  }, [slug, propertyName])

  const guestPageUrl = useMemo(() => {
    if (!finalSlug) {
      return ""
    }

    return `/guest/${finalSlug}`
  }, [finalSlug])

  const isMalteseMaisonette = useMemo(() => {
    return (
      finalSlug.includes("maltese-maisonette") ||
      propertyName
        .toLowerCase()
        .includes("maltese maisonette")
    )
  }, [finalSlug, propertyName])

  const heroPreviewImage = useMemo(() => {
    if (heroImageUrl.trim()) {
      return heroImageUrl.trim()
    }

    if (isMalteseMaisonette) {
      return malteseMaisonetteHeroImage
    }

    return ""
  }, [heroImageUrl, isMalteseMaisonette])

  const heroPreviewTitle = useMemo(() => {
    return (
      heroTitle.trim() ||
      `Welcome to ${propertyName || "Your Stay"}`
    )
  }, [heroTitle, propertyName])

  const heroPreviewIntro = useMemo(() => {
    return (
      heroIntro.trim() ||
      "A comfortable private stay with everything you need in one place."
    )
  }, [heroIntro])

  const aboutPreviewTitle = useMemo(() => {
    return aboutTitle.trim() || "About this stay"
  }, [aboutTitle])

  const aboutPreviewIntro = useMemo(() => {
    return (
      aboutIntro.trim() ||
      "A private stay designed to make your visit simple, comfortable and easy to manage."
    )
  }, [aboutIntro])

  const aboutPreviewDescription = useMemo(() => {
    return (
      aboutDescription.trim() ||
      description.trim() ||
      "Add a warm, guest-friendly description of the apartment here."
    )
  }, [aboutDescription, description])

  const aboutPreviewHighlights = useMemo(() => {
    const items = splitHighlights(aboutHighlights)

    if (items.length > 0) {
      return items
    }

    return [
      "Private guest space",
      "Useful stay information",
      "AI Concierge support",
      "Local tips and essentials",
    ]
  }, [aboutHighlights])

  const guestPageReady = Boolean(
    guestPageUrl &&
      heroPreviewTitle.trim() &&
      aboutPreviewDescription.trim()
  )

  const accessReady = Boolean(
    wifiName.trim() ||
      wifiPassword.trim() ||
      checkinTime.trim() ||
      checkoutTime.trim() ||
      checkinInstructions.trim()
  )

  const welcomeReady = Boolean(
    welcomebookEnabled &&
      (description.trim() ||
        houseRules.trim() ||
        checkoutNotes.trim())
  )

  const aiReady = Boolean(
    aiEnabled &&
      (faq.trim() ||
        troubleshooting.trim() ||
        guestStyle.trim() ||
        hiddenNotes.trim())
  )

  const extraServicesReady = Boolean(
    extraServicesEnabled &&
      (extraServicesTitle.trim() ||
        extraServicesIntro.trim() ||
        extraServicesList.trim())
  )

  const locationLabel = [city, country]
    .filter(Boolean)
    .join(", ")

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

        const guestPage =
          knowledgeBase.guest_page || {}

        const welcomeBook =
          knowledgeBase.welcome_book || {}

        const extraServices =
          knowledgeBase.extra_services || {}

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

        setHeroTitle(
          guestPage.hero_title ||
            `Welcome to ${property.property_name || ""}`
        )
        setHeroIntro(guestPage.hero_intro || "")
        setHeroImageUrl(guestPage.hero_image_url || "")
        setAboutTitle(
          guestPage.about_title || "About this stay"
        )
        setAboutIntro(guestPage.about_intro || "")
        setAboutDescription(
          guestPage.about_description ||
            welcomeBook.description ||
            property.description ||
            ""
        )
        setAboutHighlights(
          guestPage.about_highlights || ""
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

        setExtraServicesEnabled(
          Boolean(extraServices.enabled)
        )
        setExtraServicesTitle(
          extraServices.title || "Extra Services"
        )
        setExtraServicesIntro(
          extraServices.intro || ""
        )
        setExtraServicesList(
          extraServices.services || ""
        )
        setExtraServicesHostNote(
          extraServices.host_note || ""
        )

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

  async function copyGuestUrl() {
    if (!guestPageUrl) {
      alert("Guest page URL is not available yet.")
      return
    }

    const absoluteUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${guestPageUrl}`
        : guestPageUrl

    try {
      await navigator.clipboard.writeText(absoluteUrl)
      setSaveMessage("Guest page URL copied.")
    } catch (error) {
      console.error("COPY GUEST URL ERROR:", error)
      alert("Unable to copy guest page URL")
    }
  }

  async function copyWifi() {
    try {
      await navigator.clipboard.writeText(
        `Network: ${wifiName} | Password: ${wifiPassword}`
      )

      setSaveMessage("WiFi copied.")
    } catch (error) {
      console.error("COPY WIFI ERROR:", error)
      alert("Unable to copy WiFi")
    }
  }

  function applyDefaultHeroImage() {
    setHeroImageUrl(malteseMaisonetteHeroImage)
    setSaveMessage(
      "Default hero image applied. Review and save when ready."
    )
  }

  function applyPremiumGuestCopy() {
    const cleanName = propertyName.trim() || "Your Stay"
    const cleanCity = city.trim() || "the local area"

    setHeroTitle(`Welcome to ${cleanName}`)

    setHeroIntro(
      `A warm, comfortable and thoughtfully prepared stay in ${cleanCity}, designed to make your visit simple, relaxed and memorable.`
    )

    setAboutTitle("About this stay")

    setAboutIntro(
      "A private and comfortable space designed to help you feel at home from the moment you arrive."
    )

    setAboutDescription(
      `This property offers a practical and welcoming base for your stay in ${cleanCity}. Inside, guests will find the essential comforts needed for a smooth visit, including a comfortable sleeping area, useful home amenities, WiFi, practical arrival information and local tips available through the digital guest page. The space is designed to be easy to use, easy to settle into and convenient for guests who want a simple, independent and well-supported stay.`
    )

    setAboutHighlights(
      "Private guest space\nComfortable stay experience\nWiFi and practical essentials\nLocal tips and AI Concierge support"
    )

    setSaveMessage(
      "Premium guest page copy applied. Review and save when ready."
    )
  }

  function applyMalteseMaisonetteGuestCopy() {
    setHeroTitle("Welcome to Maltese Maisonette")

    setHeroIntro(
      "A cozy Maltese maisonette in central Sliema, designed for a simple, comfortable and authentic stay by the sea."
    )

    setHeroImageUrl(malteseMaisonetteHeroImage)

    setAboutTitle("About this stay")

    setAboutIntro(
      "This private one-bedroom maisonette gives you the feeling of a traditional Maltese home, with the comfort and independence of having the entire place to yourself."
    )

    setAboutDescription(
      "Inside, you’ll find a queen-size bedroom with A/C, a living area with sofa, a fully equipped kitchen, a bathroom with shower and washing machine, high-speed WiFi, a desk for work or study, and a small outdoor space. The apartment is set on a quiet Maltese street in central Sliema, close to the promenade, cafés, shops, public transport, Balluta Bay and St Julian’s nightlife. It is ideal for guests who want a central location, practical comfort and an authentic local base while staying in Malta."
    )

    setAboutHighlights(
      "Private one-bedroom maisonette\nCentral Sliema location\n100m from the promenade\nHigh-speed WiFi and desk\nKitchen and washing machine\nA/C in the bedroom"
    )

    setSaveMessage(
      "Maltese Maisonette guest page copy applied. Review and save when ready."
    )
  }

  function applyExtraServicesTemplate() {
    setExtraServicesTitle("Extra Services")
    setExtraServicesIntro(
      "Enhance your stay with selected local services and trusted partner recommendations. Availability may vary, so please contact the host before booking."
    )
    setExtraServicesList(
      "Airport transfer — Available on request, subject to availability and price confirmation\nScooter rental — Local partner options can be shared on request\nCar rental — Recommended providers available nearby\nBoat trips & excursions — Seasonal tours and local experiences can be recommended\nMassage or wellness services — Available with advance booking when possible\nLate checkout — Subject to availability and host approval\nLuggage storage — Ask the host for available options"
    )
    setExtraServicesHostNote(
      "Internal note: add partner contacts, prices, commissions, availability rules and services that require manual host approval."
    )
    setSaveMessage(
      "Extra Services template applied. Review, enable and save when ready."
    )
  }

  async function saveProperty() {
    if (!propertyName.trim()) {
      alert("Property name is required")
      return
    }

    try {
      setSaving(true)
      setSaveMessage("")

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
          guest_page: {
            hero_title: heroTitle,
            hero_intro: heroIntro,
            hero_image_url: heroImageUrl,
            about_title: aboutTitle,
            about_intro: aboutIntro,
            about_description: aboutDescription,
            about_highlights: aboutHighlights,
          },
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
          extra_services: {
            enabled: extraServicesEnabled,
            title: extraServicesTitle,
            intro: extraServicesIntro,
            services: extraServicesList,
            host_note: extraServicesHostNote,
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
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <div className="uppercase tracking-[0.25em] text-[11px] text-gray-400 font-semibold mb-2">
              PROPERTY CONTROL PANEL
            </div>

            <h1 className="text-3xl font-bold text-gray-900">
              {propertyName || "Edit Property"}
            </h1>

            <div className="text-gray-500 mt-2">
              {locationLabel || "Manage the main guest-facing information for this property."}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="bg-white border border-gray-200 text-gray-900 px-5 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition"
            >
              Dashboard
            </Link>

            {guestPageUrl && (
              <Link
                href={guestPageUrl}
                target="_blank"
                className="bg-white border border-gray-200 text-gray-900 px-5 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition"
              >
                Guest Page
              </Link>
            )}

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

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {saveMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-3xl px-6 py-4 font-medium">
            {saveMessage}
          </div>
        )}

        <section className="bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white rounded-[32px] p-7 md:p-8 shadow-2xl">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-8 mb-8">
            <div>
              <div className="uppercase tracking-[0.3em] text-xs text-white/50 mb-4">
                SINGLE PROPERTY COMMAND CENTER
              </div>

              <h2 className="text-4xl md:text-5xl font-black mb-4">
                {propertyName || "Property Setup"}
              </h2>

              <p className="text-white/60 max-w-2xl leading-relaxed">
                Control the guest-facing page, QR/NFC access, AI concierge, welcome book, operational alerts and cleaning workflows for this property.
              </p>

              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  href="/dashboard"
                  className="bg-white text-black rounded-2xl px-5 py-3 text-sm font-semibold"
                >
                  Back to Dashboard
                </Link>

                {guestPageUrl && (
                  <Link
                    href={guestPageUrl}
                    target="_blank"
                    className="bg-white/10 border border-white/10 text-white rounded-2xl px-5 py-3 text-sm font-semibold hover:bg-white/15 transition"
                  >
                    Open Guest Page
                  </Link>
                )}

                <button
                  type="button"
                  onClick={copyGuestUrl}
                  className="bg-white/10 border border-white/10 text-white rounded-2xl px-5 py-3 text-sm font-semibold hover:bg-white/15 transition"
                >
                  Copy Guest URL
                </button>
              </div>
            </div>

            <div className="bg-white/10 border border-white/10 rounded-3xl p-5 min-w-full xl:min-w-[340px]">
              <div className="text-white/50 text-xs uppercase tracking-[0.25em] mb-3">
                Guest URL
              </div>

              <div className="font-bold break-all">
                {guestPageUrl || "Guest page URL not available"}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="bg-white/10 rounded-2xl p-4">
                  <div className="text-white/50 text-xs mb-1">
                    City
                  </div>

                  <div className="font-bold">
                    {city || "Not set"}
                  </div>
                </div>

                <div className="bg-white/10 rounded-2xl p-4">
                  <div className="text-white/50 text-xs mb-1">
                    AI
                  </div>

                  <div className="font-bold">
                    {aiEnabled ? "ON" : "OFF"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
            <CommandActionCard
              icon="📲"
              title="QR / NFC"
              description="Manage guest access QR and NFC-ready links."
              href="/dashboard/qr"
              dark
            />

            <CommandActionCard
              icon="💬"
              title="Inbox"
              description="Review conversations and AI guest messages."
              href="/dashboard/inbox"
              dark
            />

            <CommandActionCard
              icon="🚨"
              title="Issues"
              description="Check escalations, complaints and guest problems."
              href="/dashboard/issues"
              dark
            />

            <CommandActionCard
              icon="🧹"
              title="Cleaning"
              description="Manage cleaning tasks and turnover status."
              href="/dashboard/cleaning"
              dark
            />

            <CommandActionCard
              icon="📶"
              title="Copy WiFi"
              description="Copy WiFi details for quick guest support."
              onClick={copyWifi}
              dark
              disabled={!wifiName && !wifiPassword}
            />
          </div>
        </section>

        <section className="bg-white rounded-[32px] p-6 md:p-7 shadow-xl border border-black/5">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-7">
            <div>
              <div className="uppercase tracking-[0.3em] text-xs text-gray-400 mb-3">
                PROPERTY STATUS
              </div>

              <h2 className="text-3xl font-black text-gray-950">
                Setup Health
              </h2>
            </div>

            <div className="text-gray-500 max-w-2xl leading-relaxed">
              Use this panel to quickly understand whether the guest-facing and operational parts of this property are ready.
            </div>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
            <StatusPill
              label="Guest Page"
              value={guestPageReady ? "Ready" : "Needs setup"}
              active={guestPageReady}
            />

            <StatusPill
              label="Access Info"
              value={accessReady ? "Configured" : "Incomplete"}
              active={accessReady}
            />

            <StatusPill
              label="Welcome Book"
              value={welcomeReady ? "Ready" : "Needs content"}
              active={welcomeReady}
            />

            <StatusPill
              label="AI Concierge"
              value={aiEnabled ? "ON" : "OFF"}
              active={aiReady}
            />

            <StatusPill
              label="Extra Services"
              value={extraServicesEnabled ? "ON" : "OFF"}
              active={extraServicesReady}
            />
          </div>
        </section>

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
                Used for /guest/slug, QR codes and NFC links.
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
          title="Guest Page Experience"
          subtitle="Create the premium guest-facing page shown after scanning the QR/NFC link. This is the first impression guests see before asking the AI Concierge."
          icon="✨"
        >
          <div className="mb-6 grid md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={applyPremiumGuestCopy}
              className="bg-black text-white rounded-2xl px-5 py-4 font-semibold hover:opacity-90 transition"
            >
              ✨ Generate Premium Copy
            </button>

            <button
              type="button"
              onClick={applyMalteseMaisonetteGuestCopy}
              className="bg-[#f4f1eb] text-black border border-black/5 rounded-2xl px-5 py-4 font-semibold hover:bg-[#ebe6dd] transition"
            >
              🏡 Use Maltese Maisonette Copy
            </button>

            <button
              type="button"
              onClick={applyDefaultHeroImage}
              className="bg-white text-black border border-gray-200 rounded-2xl px-5 py-4 font-semibold hover:bg-gray-50 transition"
            >
              🖼️ Apply Default Image
            </button>
          </div>

          <div className="mb-8 bg-amber-50 border border-amber-100 rounded-3xl p-5">
            <div className="font-bold text-amber-950 mb-2">
              Guest page setup
            </div>

            <p className="text-sm text-amber-900/70 leading-relaxed">
              Use the quick actions to create a strong first draft, then review the text and save.
              The guest page URL can be used for QR codes, NFC tags, printed welcome cards and guest messages.
            </p>

            <div className="mt-3 text-xs text-amber-900/60 break-all">
              Recommended local hero path: {malteseMaisonetteHeroImage}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_0.95fr] gap-8">
            <div>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Hero Title
                  </label>
                  <input
                    value={heroTitle}
                    onChange={(event) =>
                      setHeroTitle(event.target.value)
                    }
                    placeholder="Welcome to Maltese Maisonette"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-black"
                  />
                  <div className="text-xs text-gray-400 mt-2">
                    Main title shown over the hero image.
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Hero Image URL
                  </label>
                  <input
                    value={heroImageUrl}
                    onChange={(event) =>
                      setHeroImageUrl(event.target.value)
                    }
                    placeholder={malteseMaisonetteHeroImage}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-black"
                  />
                  <div className="text-xs text-gray-400 mt-2">
                    Use a public URL or a local path from the public folder.
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Hero Intro
                </label>
                <textarea
                  value={heroIntro}
                  onChange={(event) =>
                    setHeroIntro(event.target.value)
                  }
                  rows={3}
                  placeholder="A cozy Maltese maisonette in central Sliema, designed for a simple, comfortable and authentic stay by the sea."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-black resize-none"
                />
                <div className="text-xs text-gray-400 mt-2">
                  Keep this short: one or two lines only.
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="uppercase tracking-[0.25em] text-[11px] text-gray-400 font-semibold mb-4">
                  About This Stay
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    About Section Title
                  </label>
                  <input
                    value={aboutTitle}
                    onChange={(event) =>
                      setAboutTitle(event.target.value)
                    }
                    placeholder="About this stay"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    About Intro
                  </label>
                  <textarea
                    value={aboutIntro}
                    onChange={(event) =>
                      setAboutIntro(event.target.value)
                    }
                    rows={3}
                    placeholder="This private one-bedroom maisonette gives you the feeling of a traditional Maltese home, with the comfort and independence of having the entire place to yourself."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-black resize-none"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    About Description
                  </label>
                  <textarea
                    value={aboutDescription}
                    onChange={(event) =>
                      setAboutDescription(event.target.value)
                    }
                    rows={6}
                    placeholder="Inside, guests will find a queen-size bedroom with A/C, a living area, a kitchen, a bathroom with shower and washing machine, high-speed WiFi, a desk and a small outdoor space..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-black resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Highlights
                  </label>
                  <textarea
                    value={aboutHighlights}
                    onChange={(event) =>
                      setAboutHighlights(event.target.value)
                    }
                    rows={5}
                    placeholder={
                      "Private one-bedroom maisonette\nCentral Sliema location\nHigh-speed WiFi and desk\nKitchen and washing machine"
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-black resize-none"
                  />
                  <div className="text-xs text-gray-400 mt-2">
                    Add one highlight per line. The preview shows the first four.
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:sticky lg:top-32 h-fit">
              <div className="rounded-[32px] overflow-hidden bg-black text-white shadow-2xl border border-black">
                <div className="relative min-h-[360px]">
                  {heroPreviewImage ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${heroPreviewImage})`,
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-black" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/10" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/10" />

                  <div className="relative p-6 min-h-[360px] flex flex-col justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-3 py-2 text-xs text-white/90 mb-4 backdrop-blur-md">
                        <span>✨</span>
                        <span>Live Preview</span>
                      </div>

                      <div className="uppercase tracking-[0.25em] text-[10px] text-white/60 mb-3">
                        AI CO-HOST EXPERIENCE
                      </div>

                      <h3 className="text-3xl font-black leading-[0.95] mb-4 drop-shadow-xl">
                        {heroPreviewTitle}
                      </h3>

                      <p className="text-white/85 text-sm leading-relaxed drop-shadow-xl">
                        {heroPreviewIntro}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-6">
                      {city && (
                        <div className="bg-white/15 border border-white/20 rounded-full px-3 py-2 text-xs backdrop-blur-md">
                          📍 {city}
                          {country ? `, ${country}` : ""}
                        </div>
                      )}

                      {checkinTime && (
                        <div className="bg-white/15 border border-white/20 rounded-full px-3 py-2 text-xs backdrop-blur-md">
                          🔑 Check-in: {checkinTime}
                        </div>
                      )}

                      {checkoutTime && (
                        <div className="bg-white/15 border border-white/20 rounded-full px-3 py-2 text-xs backdrop-blur-md">
                          🚪 Check-out: {checkoutTime}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white text-black p-6">
                  <div className="uppercase tracking-[0.25em] text-[10px] text-gray-400 mb-3">
                    THE APARTMENT
                  </div>

                  <h3 className="text-2xl font-black mb-3">
                    {aboutPreviewTitle}
                  </h3>

                  <p className="text-gray-800 leading-relaxed mb-4">
                    {aboutPreviewIntro}
                  </p>

                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-5 whitespace-pre-line">
                    {aboutPreviewDescription}
                  </p>

                  <div className="mt-5 bg-[#f4f1eb] rounded-3xl p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-gray-400 mb-3">
                      Highlights
                    </div>

                    <div className="space-y-2">
                      {aboutPreviewHighlights
                        .slice(0, 4)
                        .map((item) => (
                          <div
                            key={item}
                            className="bg-white rounded-2xl px-3 py-3 text-sm font-bold flex items-center gap-2"
                          >
                            <span>✓</span>
                            <span>{item}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <button
                      type="button"
                      onClick={copyGuestUrl}
                      className="bg-black text-white rounded-2xl px-4 py-3 text-sm font-semibold"
                    >
                      Copy URL
                    </button>

                    {guestPageUrl ? (
                      <Link
                        href={guestPageUrl}
                        target="_blank"
                        className="bg-gray-100 text-black rounded-2xl px-4 py-3 text-sm font-semibold text-center"
                      >
                        Open Page
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="bg-gray-100 text-gray-400 rounded-2xl px-4 py-3 text-sm font-semibold"
                      >
                        Open Page
                      </button>
                    )}
                  </div>

                  <div className="mt-4 text-xs text-gray-400 break-all">
                    {guestPageUrl || "Guest page URL not available yet."}
                  </div>
                </div>
              </div>
            </div>
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
          title="Extra Services / Upselling"
          subtitle="Optional guest-facing offers, partner services and upselling opportunities. Keep it disabled until you have real services to show."
          icon="🛎️"
        >
          <div className="mb-6 bg-amber-50 border border-amber-100 rounded-3xl p-5">
            <div className="font-bold text-amber-950 mb-2">
              Optional revenue module
            </div>

            <p className="text-sm text-amber-900/70 leading-relaxed">
              Use this section for future upselling: scooter rental, car rental,
              airport transfers, tours, excursions, massages, private chef,
              breakfast baskets, late checkout, luggage storage, beach clubs,
              restaurant discounts or local partnerships.
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid md:grid-cols-[1fr_auto] gap-4 items-stretch">
              <button
                type="button"
                onClick={() =>
                  setExtraServicesEnabled(!extraServicesEnabled)
                }
                className={`w-full rounded-3xl border px-6 py-5 text-left transition ${
                  extraServicesEnabled
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-900 border-gray-200"
                }`}
              >
                <div className="font-bold mb-1">
                  Show Extra Services on Guest Page
                </div>

                <div
                  className={`text-sm ${
                    extraServicesEnabled
                      ? "text-white/60"
                      : "text-gray-500"
                  }`}
                >
                  {extraServicesEnabled
                    ? "Enabled — guests can see this module when content is available."
                    : "Disabled — the module is saved but hidden from guests."}
                </div>
              </button>

              <button
                type="button"
                onClick={applyExtraServicesTemplate}
                className="bg-[#f4f1eb] text-black border border-black/5 rounded-3xl px-6 py-5 font-semibold hover:bg-[#ebe6dd] transition"
              >
                Use Template
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Section Title
              </label>
              <input
                value={extraServicesTitle}
                onChange={(event) =>
                  setExtraServicesTitle(event.target.value)
                }
                placeholder="Extra Services"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Guest Intro
              </label>
              <textarea
                value={extraServicesIntro}
                onChange={(event) =>
                  setExtraServicesIntro(event.target.value)
                }
                rows={3}
                placeholder="Enhance your stay with selected local services and trusted partner recommendations."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Services / Offers
              </label>
              <textarea
                value={extraServicesList}
                onChange={(event) =>
                  setExtraServicesList(event.target.value)
                }
                rows={8}
                placeholder={
                  "Airport transfer — Contact host for availability and price\nScooter rental — Local partner available on request\nBoat trip — Recommended seasonal excursion\nMassage at home — Available with advance booking"
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black resize-none"
              />
              <div className="text-xs text-gray-400 mt-2">
                Add one service per line or write a short formatted list.
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Internal Host Note
              </label>
              <textarea
                value={extraServicesHostNote}
                onChange={(event) =>
                  setExtraServicesHostNote(event.target.value)
                }
                rows={4}
                placeholder="Internal note: partner contacts, commission details, availability rules, prices to confirm manually..."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black resize-none"
              />
              <div className="text-xs text-gray-400 mt-2">
                Internal note for the host. This should not be shown directly to guests.
              </div>
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
              {
                label: "Extra Services",
                value: extraServicesEnabled,
                onChange: setExtraServicesEnabled,
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