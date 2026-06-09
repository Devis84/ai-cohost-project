 "use client";

import { useEffect, useMemo, useState } from "react";

type WelcomeBook = {
  description: string;
  amenities: string;
  house_rules: string;
  parking: string;
  trash: string;
  ac: string;
  boiler: string;
  restaurants: string;
  transport: string;
  local_guide: string;
  emergency: string;
  checkout_notes: string;
  extra_notes: string;
};

type AiTraining = {
  faq: string;
  troubleshooting: string;
  guest_style: string;
  hidden_notes: string;
  additional_notes: string;
};

type KnowledgeBase = {
  welcome_book: WelcomeBook;
  ai_training: AiTraining;
};

type StoredKnowledgeBase = {
  welcome_book?: Partial<WelcomeBook>;
  ai_training?: Partial<AiTraining>;
};

type Property = {
  id: string;
  property_name: string;
  slug?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  wifi_name?: string | null;
  wifi_password?: string | null;
  checkin_time?: string | null;
  checkout_time?: string | null;
  house_rules?: string | null;
  checkin_instructions?: string | null;
  description?: string | null;
  amenities?: string | null;
  ai_knowledge?: string | null;
  local_info?: string | null;
  emergency_info?: string | null;
  parking_info?: string | null;
  emergency_numbers?: string | null;
  lockbox_code?: string | null;
  ai_enabled?: boolean | null;
  whatsapp_enabled?: boolean | null;
  telegram_enabled?: boolean | null;
  welcomebook_enabled?: boolean | null;
  knowledge_base?: StoredKnowledgeBase | null;
};

function createEmptyKnowledgeBase(): KnowledgeBase {
  return {
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
  };
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function mergeKnowledgeBase(property: Property): KnowledgeBase {
  const empty = createEmptyKnowledgeBase();

  const savedWelcome: Partial<WelcomeBook> =
    property.knowledge_base?.welcome_book || {};

  const savedAi: Partial<AiTraining> =
    property.knowledge_base?.ai_training || {};

  return {
    welcome_book: {
      ...empty.welcome_book,
      ...savedWelcome,
      description:
        savedWelcome.description ||
        safeString(property.description),
      amenities:
        savedWelcome.amenities ||
        safeString(property.amenities),
      house_rules:
        savedWelcome.house_rules ||
        safeString(property.house_rules),
      parking:
        savedWelcome.parking ||
        safeString(property.parking_info),
      local_guide:
        savedWelcome.local_guide ||
        safeString(property.local_info),
      emergency:
        savedWelcome.emergency ||
        safeString(property.emergency_info),
    },

    ai_training: {
      ...empty.ai_training,
      ...savedAi,
      faq:
        savedAi.faq ||
        safeString(property.ai_knowledge),
    },
  };
}

function FieldLabel({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-2">
      <label className="block text-sm font-bold text-gray-800">
        {title}
      </label>

      {description && (
        <p className="text-xs text-gray-400 leading-relaxed mt-1">
          {description}
        </p>
      )}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold mb-2">
        {icon} {title}
      </h2>

      {description && (
        <p className="text-gray-500 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] =
    useState("general");

  const [properties, setProperties] =
    useState<Property[]>([]);

  const [selectedSlug, setSelectedSlug] =
    useState("");

  const [propertyName, setPropertyName] =
    useState("");

  const [newProperty, setNewProperty] =
    useState("");

  const [isNewProperty, setIsNewProperty] =
    useState(false);

  const [loadingProperties, setLoadingProperties] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [city, setCity] =
    useState("");

  const [country, setCountry] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [wifiName, setWifiName] =
    useState("");

  const [wifiPassword, setWifiPassword] =
    useState("");

  const [checkin, setCheckin] =
    useState("");

  const [checkout, setCheckout] =
    useState("");

  const [checkinNotes, setCheckinNotes] =
    useState("");

  const [lockboxCode, setLockboxCode] =
    useState("");

  const [emergencyNumbers, setEmergencyNumbers] =
    useState("");

  const [knowledgeBase, setKnowledgeBase] =
    useState<KnowledgeBase>(createEmptyKnowledgeBase);

  const [aiEnabled, setAiEnabled] =
    useState(true);

  const [whatsappEnabled, setWhatsappEnabled] =
    useState(false);

  const [telegramEnabled, setTelegramEnabled] =
    useState(false);

  const [welcomebookEnabled, setWelcomebookEnabled] =
    useState(true);

  const selectedProperty = useMemo(() => {
    return properties.find(
      (property) =>
        (property.slug || property.id) === selectedSlug
    );
  }, [properties, selectedSlug]);

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    if (!selectedSlug || isNewProperty) {
      return;
    }

    loadPropertyData(selectedSlug);
  }, [selectedSlug, isNewProperty]);

  async function loadProperties() {
    try {
      setLoadingProperties(true);

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

      if (!selectedSlug && loadedProperties.length > 0) {
        const firstProperty = loadedProperties[0];

        setSelectedSlug(
          firstProperty.slug || firstProperty.id
        );
      }
    } catch (error) {
      console.error("LOAD PROPERTIES ERROR:", error);
      alert("Unable to load properties");
    } finally {
      setLoadingProperties(false);
    }
  }

  async function loadPropertyData(identifier: string) {
    try {
      const response = await fetch(
        `/api/properties/${encodeURIComponent(identifier)}`
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error || "Unable to load property"
        );
      }

      const property = data.property as Property;

      fillForm(property);
    } catch (error) {
      console.error("LOAD PROPERTY ERROR:", error);
      alert("Unable to load selected property");
    }
  }

  function fillForm(property: Property) {
    setPropertyName(property.property_name || "");
    setCity(property.city || "");
    setCountry(property.country || "");
    setAddress(property.address || "");

    setWifiName(property.wifi_name || "");
    setWifiPassword(property.wifi_password || "");

    setCheckin(property.checkin_time || "");
    setCheckout(property.checkout_time || "");
    setCheckinNotes(
      property.checkin_instructions || ""
    );

    setLockboxCode(property.lockbox_code || "");
    setEmergencyNumbers(
      property.emergency_numbers || ""
    );

    setKnowledgeBase(mergeKnowledgeBase(property));

    setAiEnabled(property.ai_enabled ?? true);
    setWhatsappEnabled(
      property.whatsapp_enabled ?? false
    );
    setTelegramEnabled(
      property.telegram_enabled ?? false
    );
    setWelcomebookEnabled(
      property.welcomebook_enabled ?? true
    );
  }

  function resetForm(name = "") {
    setPropertyName(name);
    setCity("");
    setCountry("");
    setAddress("");
    setWifiName("");
    setWifiPassword("");
    setCheckin("");
    setCheckout("");
    setCheckinNotes("");
    setLockboxCode("");
    setEmergencyNumbers("");
    setKnowledgeBase(createEmptyKnowledgeBase());
    setAiEnabled(true);
    setWhatsappEnabled(false);
    setTelegramEnabled(false);
    setWelcomebookEnabled(true);
  }

  function addProperty() {
    const cleanName = newProperty.trim();

    if (!cleanName) {
      alert("Enter a property name first");
      return;
    }

    const slug = createSlug(cleanName);

    setSelectedSlug(slug);
    setIsNewProperty(true);
    resetForm(cleanName);
    setNewProperty("");
  }

  async function copyWifi() {
    try {
      await navigator.clipboard.writeText(
        `Network: ${wifiName} | Password: ${wifiPassword}`
      );

      alert("WiFi copied");
    } catch (error) {
      console.error("COPY WIFI ERROR:", error);
      alert("Unable to copy WiFi");
    }
  }

  async function save() {
    if (!propertyName.trim()) {
      alert("Property name is required");
      return;
    }

    const slug =
      selectedSlug ||
      selectedProperty?.slug ||
      createSlug(propertyName);

    const payload = {
      property_name: propertyName.trim(),
      slug,

      city,
      country,
      address,

      wifi_name: wifiName,
      wifi_password: wifiPassword,

      checkin_time: checkin,
      checkout_time: checkout,
      checkin_instructions: checkinNotes,

      lockbox_code: lockboxCode,

      emergency_numbers: emergencyNumbers,

      house_rules:
        knowledgeBase.welcome_book.house_rules,
      description:
        knowledgeBase.welcome_book.description,
      amenities:
        knowledgeBase.welcome_book.amenities,
      parking_info:
        knowledgeBase.welcome_book.parking,
      local_info:
        knowledgeBase.welcome_book.local_guide,
      emergency_info:
        knowledgeBase.welcome_book.emergency,
      ai_knowledge:
        knowledgeBase.ai_training.faq,

      knowledge_base: knowledgeBase,

      ai_enabled: aiEnabled,
      whatsapp_enabled: whatsappEnabled,
      telegram_enabled: telegramEnabled,
      welcomebook_enabled: welcomebookEnabled,
    };

    try {
      setSaving(true);

      const response = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error || "Unable to save property"
        );
      }

      const savedProperty =
        data.property as Property;

      alert("Property saved successfully");

      setIsNewProperty(false);
      setSelectedSlug(
        savedProperty.slug || savedProperty.id
      );

      await loadProperties();
    } catch (error) {
      console.error("SAVE PROPERTY ERROR:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Error saving property"
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteProperty() {
    if (!selectedSlug) {
      return;
    }

    const confirmDelete = confirm(
      `Delete ${propertyName || selectedSlug}?`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `/api/properties/${encodeURIComponent(selectedSlug)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error || "Unable to delete property"
        );
      }

      alert("Property deleted");

      setSelectedSlug("");
      setIsNewProperty(false);
      resetForm();
      await loadProperties();
    } catch (error) {
      console.error("DELETE PROPERTY ERROR:", error);
      alert("Error deleting property");
    }
  }

  function updateWelcomeBook(
    field: keyof WelcomeBook,
    value: string
  ) {
    setKnowledgeBase((current) => ({
      ...current,
      welcome_book: {
        ...current.welcome_book,
        [field]: value,
      },
    }));
  }

  function updateAiTraining(
    field: keyof AiTraining,
    value: string
  ) {
    setKnowledgeBase((current) => ({
      ...current,
      ai_training: {
        ...current.ai_training,
        [field]: value,
      },
    }));
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
                Property Dashboard
              </h1>

              <p className="text-white/70 text-lg max-w-2xl leading-relaxed">
                Manage welcome pages, AI concierge, check-in instructions,
                local recommendations and guest experience from one place.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 min-w-[280px]">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/10">
                <div className="text-white/50 text-sm mb-2">
                  Properties
                </div>

                <div className="text-3xl font-bold">
                  {properties.length}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/10">
                <div className="text-white/50 text-sm mb-2">
                  AI Concierge
                </div>

                <div className="text-3xl font-bold">
                  {aiEnabled ? "ON" : "OFF"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 pb-32">
        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          <aside className="space-y-3">
            <button
              onClick={() => setActiveTab("general")}
              className={`w-full text-left px-5 py-4 rounded-2xl transition ${
                activeTab === "general"
                  ? "bg-black text-white shadow-xl"
                  : "bg-white border border-gray-200"
              }`}
            >
              🏡 General
            </button>

            <button
              onClick={() => setActiveTab("welcomebook")}
              className={`w-full text-left px-5 py-4 rounded-2xl transition ${
                activeTab === "welcomebook"
                  ? "bg-black text-white shadow-xl"
                  : "bg-white border border-gray-200"
              }`}
            >
              📘 Welcome Book
            </button>

            <button
              onClick={() => setActiveTab("ai")}
              className={`w-full text-left px-5 py-4 rounded-2xl transition ${
                activeTab === "ai"
                  ? "bg-black text-white shadow-xl"
                  : "bg-white border border-gray-200"
              }`}
            >
              🤖 AI Training
            </button>

            <a
              href="/dashboard/qr"
              className="w-full block text-left px-5 py-4 rounded-2xl transition bg-white border border-gray-200 hover:bg-black hover:text-white"
            >
              📲 Guest Access QR/NFC
            </a>

            <a
              href="/dashboard/inbox"
              className="w-full block text-left px-5 py-4 rounded-2xl transition bg-white border border-gray-200 hover:bg-black hover:text-white"
            >
              💬 Inbox
            </a>

            <a
              href="/dashboard/issues"
              className="w-full block text-left px-5 py-4 rounded-2xl transition bg-white border border-gray-200 hover:bg-black hover:text-white"
            >
              🚨 Issues
            </a>

            <a
              href="/dashboard/notifications"
              className="w-full block text-left px-5 py-4 rounded-2xl transition bg-white border border-gray-200 hover:bg-black hover:text-white"
            >
              🔔 Notifications
            </a>

            <a
              href="/dashboard/cleaning"
              className="w-full block text-left px-5 py-4 rounded-2xl transition bg-white border border-gray-200 hover:bg-black hover:text-white"
            >
              🧹 Cleaning
            </a>

            <a
              href="/dashboard/billing"
              className="w-full block text-left px-5 py-4 rounded-2xl transition bg-white border border-gray-200 hover:bg-black hover:text-white"
            >
              💳 Billing
            </a>

            <a
              href="/logout"
              className="w-full block text-left px-5 py-4 rounded-2xl transition bg-white border border-red-100 text-red-600 hover:bg-red-600 hover:text-white"
            >
              🚪 Logout
            </a>
          </aside>

          <div className="space-y-8">
            {activeTab === "general" && (
              <>
                <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
                  <SectionHeader
                    icon="🏡"
                    title="Property Identity"
                    description="Select, create or rename the property that will be shown to guests."
                  />

                  <div className="grid md:grid-cols-[1fr_auto] gap-4 mb-4">
                    <select
                      className="w-full border border-gray-200 rounded-2xl p-4 bg-white"
                      value={selectedSlug}
                      onChange={(event) => {
                        setIsNewProperty(false);
                        setSelectedSlug(event.target.value);
                      }}
                      disabled={loadingProperties}
                    >
                      <option value="">
                        {loadingProperties
                          ? "Loading properties..."
                          : "Select property"}
                      </option>

                      {properties.map((property) => (
                        <option
                          key={property.id}
                          value={property.slug || property.id}
                        >
                          {property.property_name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={deleteProperty}
                      className="bg-red-500 hover:bg-red-600 text-white px-6 rounded-2xl transition"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="grid md:grid-cols-[1fr_auto] gap-3 mb-4">
                    <input
                      className="border border-gray-200 rounded-2xl p-4"
                      placeholder="Add new property, e.g. Big House"
                      value={newProperty}
                      onChange={(event) =>
                        setNewProperty(event.target.value)
                      }
                    />

                    <button
                      className="bg-black text-white px-6 rounded-2xl"
                      onClick={addProperty}
                    >
                      + Add Property
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel
                        title="Property display name"
                        description="This is the property name shown in the dashboard and guest page."
                      />

                      <input
                        className="w-full border border-gray-200 rounded-2xl p-4"
                        placeholder="Example: Maltese Maisonette"
                        value={propertyName}
                        onChange={(event) =>
                          setPropertyName(event.target.value)
                        }
                      />
                    </div>

                    <div>
                      <FieldLabel
                        title="Property slug"
                        description="Stable URL identifier used for the guest page and QR/NFC link."
                      />

                      <input
                        className="w-full border border-gray-200 rounded-2xl p-4 bg-gray-50"
                        placeholder="Example: maltese-maisonette"
                        value={
                          selectedSlug ||
                          createSlug(propertyName)
                        }
                        onChange={(event) =>
                          setSelectedSlug(event.target.value)
                        }
                      />
                    </div>
                  </div>

                  {selectedSlug && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      <a
                        href={`/guest/${selectedSlug}`}
                        target="_blank"
                        className="bg-gray-100 hover:bg-gray-200 px-5 py-3 rounded-2xl text-sm font-semibold"
                      >
                        Open Guest Page
                      </a>

                      <a
                        href="/dashboard/qr"
                        className="bg-black text-white hover:opacity-90 px-5 py-3 rounded-2xl text-sm font-semibold"
                      >
                        Guest Access QR/NFC
                      </a>

                      <a
                        href={`/api/properties/${selectedSlug}`}
                        target="_blank"
                        className="bg-gray-100 hover:bg-gray-200 px-5 py-3 rounded-2xl text-sm font-semibold"
                      >
                        View API Data
                      </a>
                    </div>
                  )}
                </section>

                <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
                  <SectionHeader
                    icon="📝"
                    title="Property Description"
                    description="Add the main description of the property. You can paste the same text used on Airbnb, Booking.com or your direct listing."
                  />

                  <TextArea
                    placeholder="Paste the property description used on Airbnb, Booking.com or your direct listing."
                    value={knowledgeBase.welcome_book.description}
                    onChange={(value) =>
                      updateWelcomeBook(
                        "description",
                        value
                      )
                    }
                    large
                  />
                </section>

                <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
                  <SectionHeader
                    icon="📍"
                    title="Location & Arrival"
                    description="Add the location details and useful arrival information for guests."
                  />

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <FieldLabel
                        title="Town / City"
                        description="The town or area where the property is located."
                      />

                      <input
                        className="w-full border border-gray-200 rounded-2xl p-4"
                        placeholder="Example: Sliema"
                        value={city}
                        onChange={(event) =>
                          setCity(event.target.value)
                        }
                      />
                    </div>

                    <div>
                      <FieldLabel
                        title="Country"
                        description="The country where the property is located."
                      />

                      <input
                        className="w-full border border-gray-200 rounded-2xl p-4"
                        placeholder="Example: Malta"
                        value={country}
                        onChange={(event) =>
                          setCountry(event.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="mb-5">
                    <FieldLabel
                      title="Full address"
                      description="Full property address for host reference and guest arrival instructions."
                    />

                    <input
                      className="w-full border border-gray-200 rounded-2xl p-4"
                      placeholder="Enter the full property address"
                      value={address}
                      onChange={(event) =>
                        setAddress(event.target.value)
                      }
                    />
                  </div>

                  <FieldLabel
                    title="How to reach the property from the airport"
                    description="Add taxi, Bolt/Uber, public transport, approximate travel time and useful arrival tips."
                  />

                  <TextArea
                    placeholder="Example: From Malta International Airport, the easiest way to reach the apartment is by taxi or Bolt. The journey usually takes around 20–30 minutes depending on traffic. Public transport is also available, but travel time may be longer with luggage."
                    value={knowledgeBase.welcome_book.transport}
                    onChange={(value) =>
                      updateWelcomeBook("transport", value)
                    }
                  />
                </section>

                <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                    <SectionHeader
                      icon="📶"
                      title="Wi-Fi"
                      description="Add the Wi-Fi details guests should use during their stay."
                    />

                    <button
                      onClick={copyWifi}
                      className="bg-black text-white px-5 py-3 rounded-2xl"
                    >
                      Copy Wi-Fi
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel
                        title="Wi-Fi network name"
                        description="The network name guests should select on their device."
                      />

                      <input
                        className="w-full border border-gray-200 rounded-2xl p-4"
                        placeholder="Example: Melita-XXXX"
                        value={wifiName}
                        onChange={(event) =>
                          setWifiName(event.target.value)
                        }
                      />
                    </div>

                    <div>
                      <FieldLabel
                        title="Wi-Fi password"
                        description="The password guests should use to connect."
                      />

                      <input
                        className="w-full border border-gray-200 rounded-2xl p-4"
                        placeholder="Enter the Wi-Fi password"
                        value={wifiPassword}
                        onChange={(event) =>
                          setWifiPassword(event.target.value)
                        }
                      />
                    </div>
                  </div>
                </section>

                <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
                  <SectionHeader
                    icon="🔑"
                    title="Check-in & Access"
                    description="Add the arrival instructions, access method and any lockbox or door code guests may need."
                  />

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <FieldLabel
                        title="Check-in time"
                        description="The earliest time guests can check in."
                      />

                      <input
                        className="w-full border border-gray-200 rounded-2xl p-4"
                        placeholder="Example: 15:00"
                        value={checkin}
                        onChange={(event) =>
                          setCheckin(event.target.value)
                        }
                      />
                    </div>

                    <div>
                      <FieldLabel
                        title="Check-out time"
                        description="The latest time guests should leave the property."
                      />

                      <input
                        className="w-full border border-gray-200 rounded-2xl p-4"
                        placeholder="Example: 10:00"
                        value={checkout}
                        onChange={(event) =>
                          setCheckout(event.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <FieldLabel
                      title="Check-in instructions"
                      description="Explain how guests access the property, where to find the keys, door details, lockbox instructions or any important arrival notes."
                    />

                    <textarea
                      className="w-full border border-gray-200 rounded-2xl p-4 min-h-[180px]"
                      placeholder="Example: The keys are located in the lockbox near the entrance. Enter the code, collect the keys and make sure to close the lockbox after use."
                      value={checkinNotes}
                      onChange={(event) =>
                        setCheckinNotes(event.target.value)
                      }
                    />
                  </div>

                  <FieldLabel
                    title="Lockbox / door code"
                    description="Enter the lockbox PIN, smart lock code or access code if applicable."
                  />

                  <input
                    className="w-full border border-gray-200 rounded-2xl p-4"
                    placeholder="Example: 1234"
                    value={lockboxCode}
                    onChange={(event) =>
                      setLockboxCode(event.target.value)
                    }
                  />
                </section>

                <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
                  <SectionHeader
                    icon="📋"
                    title="House Rules"
                    description="Add the main house rules guests should follow during their stay."
                  />

                  <TextArea
                    placeholder={`Example:
- Quiet hours are from 23:00 to 07:00.
- No parties or events.
- No smoking inside the apartment.
- Please keep doors and windows closed when using the air conditioning.
- Please use only the towels and bedsheets provided for your stay.
- If you need anything extra, please contact the host.`}
                    value={knowledgeBase.welcome_book.house_rules}
                    onChange={(value) =>
                      updateWelcomeBook(
                        "house_rules",
                        value
                      )
                    }
                    large
                  />
                </section>

                <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
                  <SectionHeader
                    icon="🚪"
                    title="Check-out Instructions"
                    description="Explain what guests should do before leaving the property."
                  />

                  <TextArea
                    placeholder={`Example:
Check-out time is 10:00.

Before leaving, please:
- Turn off the air conditioning and lights.
- Close all windows and doors.
- Leave the keys as instructed by the host.
- Place used towels together in the bathroom.
- Do not remove towels or linens from the apartment.`}
                    value={knowledgeBase.welcome_book.checkout_notes}
                    onChange={(value) =>
                      updateWelcomeBook(
                        "checkout_notes",
                        value
                      )
                    }
                    large
                  />
                </section>

                <section className="bg-white rounded-[32px] p-7 shadow-xl border border-red-100">
                  <SectionHeader
                    icon="🚨"
                    title="Emergency Contacts"
                    description="Add emergency numbers, host contact, maintenance contact or useful local emergency information."
                  />

                  <textarea
                    className="w-full border border-gray-200 rounded-2xl p-4 min-h-[180px]"
                    placeholder={`Example:
Emergency number in Malta: 112
Host contact: [host phone]
Maintenance contact: [optional]
Nearest clinic / pharmacy: [optional]`}
                    value={emergencyNumbers}
                    onChange={(event) =>
                      setEmergencyNumbers(event.target.value)
                    }
                  />
                </section>

                <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
                  <SectionHeader
                    icon="⚙️"
                    title="Modules"
                    description="Enable or disable guest-facing modules for this property."
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="flex items-center justify-between bg-gray-50 rounded-2xl p-5">
                      <span>AI Concierge</span>

                      <input
                        type="checkbox"
                        checked={aiEnabled}
                        onChange={(event) =>
                          setAiEnabled(event.target.checked)
                        }
                      />
                    </label>

                    <label className="flex items-center justify-between bg-gray-50 rounded-2xl p-5">
                      <span>WhatsApp Integration</span>

                      <input
                        type="checkbox"
                        checked={whatsappEnabled}
                        onChange={(event) =>
                          setWhatsappEnabled(event.target.checked)
                        }
                      />
                    </label>

                    <label className="flex items-center justify-between bg-gray-50 rounded-2xl p-5">
                      <span>Telegram Integration</span>

                      <input
                        type="checkbox"
                        checked={telegramEnabled}
                        onChange={(event) =>
                          setTelegramEnabled(event.target.checked)
                        }
                      />
                    </label>

                    <label className="flex items-center justify-between bg-gray-50 rounded-2xl p-5">
                      <span>Welcome Book</span>

                      <input
                        type="checkbox"
                        checked={welcomebookEnabled}
                        onChange={(event) =>
                          setWelcomebookEnabled(
                            event.target.checked
                          )
                        }
                      />
                    </label>
                  </div>
                </section>
              </>
            )}

            {activeTab === "welcomebook" && (
              <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
                <h2 className="text-2xl font-bold mb-2">
                  📘 Welcome Book
                </h2>

                <p className="text-gray-500 mb-6">
                  Information visible to guests during the stay.
                </p>

                <div className="space-y-5">
                  <TextArea
                    placeholder="Property description"
                    value={knowledgeBase.welcome_book.description}
                    onChange={(value) =>
                      updateWelcomeBook(
                        "description",
                        value
                      )
                    }
                  />

                  <TextArea
                    placeholder="Amenities"
                    value={knowledgeBase.welcome_book.amenities}
                    onChange={(value) =>
                      updateWelcomeBook("amenities", value)
                    }
                  />

                  <TextArea
                    placeholder="House rules"
                    value={knowledgeBase.welcome_book.house_rules}
                    onChange={(value) =>
                      updateWelcomeBook(
                        "house_rules",
                        value
                      )
                    }
                  />

                  <TextArea
                    placeholder="Parking information"
                    value={knowledgeBase.welcome_book.parking}
                    onChange={(value) =>
                      updateWelcomeBook("parking", value)
                    }
                  />

                  <TextArea
                    placeholder="Trash and recycling instructions"
                    value={knowledgeBase.welcome_book.trash}
                    onChange={(value) =>
                      updateWelcomeBook("trash", value)
                    }
                  />

                  <TextArea
                    placeholder="Air conditioning instructions"
                    value={knowledgeBase.welcome_book.ac}
                    onChange={(value) =>
                      updateWelcomeBook("ac", value)
                    }
                  />

                  <TextArea
                    placeholder="Boiler / hot water instructions"
                    value={knowledgeBase.welcome_book.boiler}
                    onChange={(value) =>
                      updateWelcomeBook("boiler", value)
                    }
                  />

                  <TextArea
                    placeholder="Restaurants and food recommendations"
                    value={knowledgeBase.welcome_book.restaurants}
                    onChange={(value) =>
                      updateWelcomeBook(
                        "restaurants",
                        value
                      )
                    }
                  />

                  <TextArea
                    placeholder="Transport information"
                    value={knowledgeBase.welcome_book.transport}
                    onChange={(value) =>
                      updateWelcomeBook("transport", value)
                    }
                  />

                  <TextArea
                    placeholder="Local guide"
                    value={knowledgeBase.welcome_book.local_guide}
                    onChange={(value) =>
                      updateWelcomeBook(
                        "local_guide",
                        value
                      )
                    }
                  />

                  <TextArea
                    placeholder="Emergency information visible to guests"
                    value={knowledgeBase.welcome_book.emergency}
                    onChange={(value) =>
                      updateWelcomeBook("emergency", value)
                    }
                  />

                  <TextArea
                    placeholder="Checkout notes"
                    value={knowledgeBase.welcome_book.checkout_notes}
                    onChange={(value) =>
                      updateWelcomeBook(
                        "checkout_notes",
                        value
                      )
                    }
                  />

                  <TextArea
                    placeholder="Extra notes for this property"
                    value={knowledgeBase.welcome_book.extra_notes}
                    onChange={(value) =>
                      updateWelcomeBook("extra_notes", value)
                    }
                    large
                  />
                </div>
              </section>
            )}

            {activeTab === "ai" && (
              <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
                <h2 className="text-2xl font-bold mb-2">
                  🤖 AI Training
                </h2>

                <p className="text-gray-500 mb-6 leading-relaxed">
                  Internal AI knowledge used by the AI concierge.
                </p>

                <div className="space-y-5">
                  <TextArea
                    placeholder="FAQs"
                    value={knowledgeBase.ai_training.faq}
                    onChange={(value) =>
                      updateAiTraining("faq", value)
                    }
                  />

                  <TextArea
                    placeholder="Troubleshooting & operational notes"
                    value={
                      knowledgeBase.ai_training.troubleshooting
                    }
                    onChange={(value) =>
                      updateAiTraining(
                        "troubleshooting",
                        value
                      )
                    }
                  />

                  <TextArea
                    placeholder="Guest communication style"
                    value={knowledgeBase.ai_training.guest_style}
                    onChange={(value) =>
                      updateAiTraining(
                        "guest_style",
                        value
                      )
                    }
                  />

                  <TextArea
                    placeholder="Hidden operational notes"
                    value={knowledgeBase.ai_training.hidden_notes}
                    onChange={(value) =>
                      updateAiTraining(
                        "hidden_notes",
                        value
                      )
                    }
                  />

                  <TextArea
                    placeholder="Additional AI notes"
                    value={
                      knowledgeBase.ai_training.additional_notes
                    }
                    onChange={(value) =>
                      updateAiTraining(
                        "additional_notes",
                        value
                      )
                    }
                    large
                  />
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl bg-black text-white rounded-3xl px-6 py-5 shadow-2xl flex items-center justify-between z-50">
        <div>
          <div className="font-semibold">
            {propertyName || "No property selected"}
          </div>

          <div className="text-white/60 text-sm">
            {saving
              ? "Saving..."
              : "Changes are ready to be saved"}
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="bg-white text-black px-6 py-3 rounded-2xl font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function TextArea({
  placeholder,
  value,
  onChange,
  large = false,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  large?: boolean;
}) {
  return (
    <textarea
      className={`w-full border border-gray-200 rounded-2xl p-4 ${
        large ? "min-h-[220px]" : "min-h-[150px]"
      }`}
      placeholder={placeholder}
      value={value}
      onChange={(event) =>
        onChange(event.target.value)
      }
    />
  );
}