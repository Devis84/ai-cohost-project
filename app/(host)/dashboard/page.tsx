"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Input, Select, TextArea, Toggle } from "@/components/ui";
import { SaveBar } from "@/components/molecules/SaveBar";
import { DashboardHeader } from "@/components/organisms/DashboardHeader";
import {
  Home, BookOpen, Bot,
  MapPin, Wifi, Key, Settings, AlertCircle,
} from "lucide-react";

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

  const propertyOptions = properties.map((property) => ({
    value: property.slug || property.id,
    label: property.property_name,
  }));

  return (
    <div>
      <DashboardHeader
        eyebrow="AI CO-HOST PLATFORM"
        title="Property Dashboard"
        description="Manage welcome pages, AI concierge, check-in instructions, local recommendations and guest experience from one place."
        stats={[
          { label: "Properties", value: String(properties.length) },
          { label: "AI Concierge", value: aiEnabled ? "ON" : "OFF" },
        ]}
      />

      <div className="flex gap-3 mt-6 mb-8">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            activeTab === "general"
              ? "bg-primary text-on-primary"
              : "bg-surface-container-lowest border border-outline/30 text-on-surface"
          }`}
        >
          <Home size={16} className="inline mr-2" />
          General
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("welcomebook")}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            activeTab === "welcomebook"
              ? "bg-primary text-on-primary"
              : "bg-surface-container-lowest border border-outline/30 text-on-surface"
          }`}
        >
          <BookOpen size={16} className="inline mr-2" />
          Welcome Book
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ai")}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            activeTab === "ai"
              ? "bg-primary text-on-primary"
              : "bg-surface-container-lowest border border-outline/30 text-on-surface"
          }`}
        >
          <Bot size={16} className="inline mr-2" />
          AI Training
        </button>
      </div>

      <div className="space-y-8 pb-32">
            {activeTab === "general" && (
              <>
                <Card variant="white" padding="p-7" border>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Home size={24} /> Property
                  </h2>

                  <div className="grid md:grid-cols-[1fr_auto] gap-4 mb-4">
                    <Select
                      value={selectedSlug}
                      onChange={(event) => {
                        setIsNewProperty(false);
                        setSelectedSlug(event.target.value);
                      }}
                      disabled={loadingProperties}
                      placeholder={
                        loadingProperties
                          ? "Loading properties..."
                          : "Select property"
                      }
                      options={propertyOptions}
                    />

                    <Button
                      onClick={deleteProperty}
                      variant="secondary"
                      className="bg-error/10 text-error hover:bg-error/20 border border-error/20"
                    >
                      Delete
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-[1fr_auto] gap-3">
                    <Input
                      placeholder="Add new property"
                      value={newProperty}
                      onChange={(event) =>
                        setNewProperty(event.target.value)
                      }
                    />

                    <Button
                      variant="primary"
                      onClick={addProperty}
                    >
                      + Add Property
                    </Button>
                  </div>

                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Property display name"
                      value={propertyName}
                      onChange={(event) =>
                        setPropertyName(event.target.value)
                      }
                    />

                    <Input
                      placeholder="Slug"
                      value={
                        selectedSlug ||
                        createSlug(propertyName)
                      }
                      onChange={(event) =>
                        setSelectedSlug(event.target.value)
                      }
                    />
                  </div>

                  {selectedSlug && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      <a
                        href={`/guest/${selectedSlug}`}
                        target="_blank"
                        className="bg-surface-container hover:bg-surface-container-high px-5 py-3 rounded-2xl text-sm font-semibold"
                      >
                        Open Guest Page
                      </a>

                      <a
                        href="/dashboard/qr"
                        className="bg-primary text-on-primary hover:opacity-90 px-5 py-3 rounded-2xl text-sm font-semibold"
                      >
                        Guest Access QR/NFC
                      </a>

                      <a
                        href={`/api/properties/${selectedSlug}`}
                        target="_blank"
                        className="bg-surface-container hover:bg-surface-container-high px-5 py-3 rounded-2xl text-sm font-semibold"
                      >
                        View API Data
                      </a>
                    </div>
                  )}
                </Card>

                <Card variant="white" padding="p-7" border>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <MapPin size={24} /> Location
                  </h2>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <Input
                      placeholder="City"
                      value={city}
                      onChange={(event) =>
                        setCity(event.target.value)
                      }
                    />

                    <Input
                      placeholder="Country"
                      value={country}
                      onChange={(event) =>
                        setCountry(event.target.value)
                      }
                    />
                  </div>

                  <Input
                    placeholder="Full address"
                    value={address}
                    onChange={(event) =>
                      setAddress(event.target.value)
                    }
                  />
                </Card>

                <Card variant="white" padding="p-7" border>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Wifi size={24} /> WiFi
                    </h2>

                    <Button
                      onClick={copyWifi}
                      variant="primary"
                    >
                      Copy WiFi
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      placeholder="WiFi name"
                      value={wifiName}
                      onChange={(event) =>
                        setWifiName(event.target.value)
                      }
                    />

                    <Input
                      placeholder="WiFi password"
                      value={wifiPassword}
                      onChange={(event) =>
                        setWifiPassword(event.target.value)
                      }
                    />
                  </div>
                </Card>

                <Card variant="white" padding="p-7" border>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Key size={24} /> Check-in
                  </h2>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <Input
                      placeholder="Check-in time"
                      value={checkin}
                      onChange={(event) =>
                        setCheckin(event.target.value)
                      }
                    />

                    <Input
                      placeholder="Check-out time"
                      value={checkout}
                      onChange={(event) =>
                        setCheckout(event.target.value)
                      }
                    />
                  </div>

                  <TextArea
                    placeholder="Check-in instructions"
                    value={checkinNotes}
                    onChange={(event) =>
                      setCheckinNotes(event.target.value)
                    }
                    className="mb-4"
                  />

                  <Input
                    placeholder="Lockbox code"
                    value={lockboxCode}
                    onChange={(event) =>
                      setLockboxCode(event.target.value)
                    }
                  />
                </Card>

                <Card variant="white" padding="p-7" className="border border-error/20">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <AlertCircle size={24} /> Emergency Numbers
                  </h2>

                  <TextArea
                    placeholder="Emergency contacts, hospitals, police, maintenance..."
                    value={emergencyNumbers}
                    onChange={(event) =>
                      setEmergencyNumbers(event.target.value)
                    }
                  />
                </Card>

                <Card variant="white" padding="p-7" border>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Settings size={24} /> Modules
                  </h2>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-surface-container-lowest rounded-2xl p-5">
                      <Toggle
                        label="AI Concierge"
                        checked={aiEnabled}
                        onChange={setAiEnabled}
                      />
                    </div>

                    <div className="bg-surface-container-lowest rounded-2xl p-5">
                      <Toggle
                        label="WhatsApp Integration"
                        checked={whatsappEnabled}
                        onChange={setWhatsappEnabled}
                      />
                    </div>

                    <div className="bg-surface-container-lowest rounded-2xl p-5">
                      <Toggle
                        label="Telegram Integration"
                        checked={telegramEnabled}
                        onChange={setTelegramEnabled}
                      />
                    </div>

                    <div className="bg-surface-container-lowest rounded-2xl p-5">
                      <Toggle
                        label="Welcome Book"
                        checked={welcomebookEnabled}
                        onChange={setWelcomebookEnabled}
                      />
                    </div>
                  </div>
                </Card>
              </>
            )}

            {activeTab === "welcomebook" && (
              <Card variant="white" padding="p-7" border>
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <BookOpen size={24} /> Welcome Book
                </h2>

                <p className="text-outline mb-6">
                  Information visible to guests during the stay.
                </p>

                <div className="space-y-5">
                  <TextArea
                    placeholder="Property description"
                    value={knowledgeBase.welcome_book.description}
                    onChange={(e) =>
                      updateWelcomeBook("description", e.target.value)
                    }
                  />

                  <TextArea
                    placeholder="Amenities"
                    value={knowledgeBase.welcome_book.amenities}
                    onChange={(e) =>
                      updateWelcomeBook("amenities", e.target.value)
                    }
                  />

                  <TextArea
                    placeholder="House rules"
                    value={knowledgeBase.welcome_book.house_rules}
                    onChange={(e) =>
                      updateWelcomeBook("house_rules", e.target.value)
                    }
                  />

                  <TextArea
                    placeholder="Parking information"
                    value={knowledgeBase.welcome_book.parking}
                    onChange={(e) =>
                      updateWelcomeBook("parking", e.target.value)
                    }
                  />

                  <TextArea
                    placeholder="Trash and recycling instructions"
                    value={knowledgeBase.welcome_book.trash}
                    onChange={(e) =>
                      updateWelcomeBook("trash", e.target.value)
                    }
                  />

                  <TextArea
                    placeholder="Air conditioning instructions"
                    value={knowledgeBase.welcome_book.ac}
                    onChange={(e) =>
                      updateWelcomeBook("ac", e.target.value)
                    }
                  />

                  <TextArea
                    placeholder="Boiler / hot water instructions"
                    value={knowledgeBase.welcome_book.boiler}
                    onChange={(e) =>
                      updateWelcomeBook("boiler", e.target.value)
                    }
                  />

                  <TextArea
                    placeholder="Restaurants and food recommendations"
                    value={knowledgeBase.welcome_book.restaurants}
                    onChange={(e) =>
                      updateWelcomeBook("restaurants", e.target.value)
                    }
                  />

                  <TextArea
                    placeholder="Transport information"
                    value={knowledgeBase.welcome_book.transport}
                    onChange={(e) =>
                      updateWelcomeBook("transport", e.target.value)
                    }
                  />

                  <TextArea
                    placeholder="Local guide"
                    value={knowledgeBase.welcome_book.local_guide}
                    onChange={(e) =>
                      updateWelcomeBook("local_guide", e.target.value)
                    }
                  />

                  <TextArea
                    placeholder="Emergency information visible to guests"
                    value={knowledgeBase.welcome_book.emergency}
                    onChange={(e) =>
                      updateWelcomeBook("emergency", e.target.value)
                    }
                  />

                  <TextArea
                    placeholder="Checkout notes"
                    value={knowledgeBase.welcome_book.checkout_notes}
                    onChange={(e) =>
                      updateWelcomeBook("checkout_notes", e.target.value)
                    }
                  />

                  <TextArea
                    placeholder="Extra notes for this property"
                    value={knowledgeBase.welcome_book.extra_notes}
                    onChange={(e) =>
                      updateWelcomeBook("extra_notes", e.target.value)
                    }
                    minHeight="min-h-[220px]"
                  />
                </div>
              </Card>
            )}

            {activeTab === "ai" && (
              <Card variant="white" padding="p-7" border>
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <Bot size={24} /> AI Training
                </h2>

                <p className="text-outline mb-6 leading-relaxed">
                  Internal AI knowledge used by the AI concierge.
                </p>

                <div className="space-y-5">
                  <TextArea
                    placeholder="FAQs"
                    value={knowledgeBase.ai_training.faq}
                    onChange={(e) =>
                      updateAiTraining("faq", e.target.value)
                    }
                  />

                  <TextArea
                    placeholder="Troubleshooting & operational notes"
                    value={knowledgeBase.ai_training.troubleshooting}
                    onChange={(e) =>
                      updateAiTraining("troubleshooting", e.target.value)
                    }
                  />

                  <TextArea
                    placeholder="Guest communication style"
                    value={knowledgeBase.ai_training.guest_style}
                    onChange={(e) =>
                      updateAiTraining("guest_style", e.target.value)
                    }
                  />

                  <TextArea
                    placeholder="Hidden operational notes"
                    value={knowledgeBase.ai_training.hidden_notes}
                    onChange={(e) =>
                      updateAiTraining("hidden_notes", e.target.value)
                    }
                  />

                  <TextArea
                    placeholder="Additional AI notes"
                    value={knowledgeBase.ai_training.additional_notes}
                    onChange={(e) =>
                      updateAiTraining("additional_notes", e.target.value)
                    }
                    minHeight="min-h-[220px]"
                  />
                </div>
              </Card>
            )}
      </div>

      <SaveBar
        propertyName={propertyName}
        isSaving={saving}
        onSave={save}
      />
    </div>
  );
}
