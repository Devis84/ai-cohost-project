 "use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { DashboardCommandCenter } from "./_components/DashboardCommandCenter";
import { DashboardGeneralTab } from "./_components/DashboardGeneralTab";
import { DashboardGuestPageTab } from "./_components/DashboardGuestPageTab";
import { DashboardSaveBar } from "./_components/DashboardSaveBar";
import { DashboardSidebar } from "./_components/DashboardSidebar";

import {
  FieldLabel,
  SectionHeader,
  TextArea,
} from "./_components/DashboardUi";

import {
  createEmptyKnowledgeBase,
  createSlug,
  getPropertyIdentifier,
  mergeKnowledgeBase,
} from "./_lib/dashboard-utils";

import type {
  AiTraining,
  ExtraServices,
  GuestPageContent,
  KnowledgeBase,
  LocalGuide,
  Property,
  WelcomeBook,
} from "./_types/dashboard";

const malteseMaisonetteHeroImage =
  "/guest-images/maltese-maisonette-hero-bedroom.jpg";

const selectedPropertyStorageKey =
  "ai_cohost_selected_property_slug";

type DashboardAccess = {
  email?: string | null;
  role: string;
  isAdmin: boolean;
  isPartner: boolean;
  isViewer?: boolean;
  isActive?: boolean;
  canCreateProperty: boolean;
  canDeleteProperty: boolean;
  reason?: string;
};

const defaultDashboardAccess: DashboardAccess = {
  email: null,
  role: "admin",
  isAdmin: true,
  isPartner: false,
  isViewer: false,
  isActive: true,
  canCreateProperty: true,
  canDeleteProperty: true,
  reason: "frontend_default_admin",
};

function normalizeDashboardAccess(value: unknown): DashboardAccess {
  if (!value || typeof value !== "object") {
    return defaultDashboardAccess;
  }

  const access = value as Partial<DashboardAccess>;

  return {
    email:
      typeof access.email === "string" ? access.email : null,
    role:
      typeof access.role === "string"
        ? access.role
        : defaultDashboardAccess.role,
    isAdmin:
      typeof access.isAdmin === "boolean"
        ? access.isAdmin
        : defaultDashboardAccess.isAdmin,
    isPartner:
      typeof access.isPartner === "boolean"
        ? access.isPartner
        : false,
    isViewer:
      typeof access.isViewer === "boolean"
        ? access.isViewer
        : false,
    isActive:
      typeof access.isActive === "boolean"
        ? access.isActive
        : true,
    canCreateProperty:
      typeof access.canCreateProperty === "boolean"
        ? access.canCreateProperty
        : true,
    canDeleteProperty:
      typeof access.canDeleteProperty === "boolean"
        ? access.canDeleteProperty
        : true,
    reason:
      typeof access.reason === "string"
        ? access.reason
        : "",
  };
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("general");

  const [properties, setProperties] =
    useState<Property[]>([]);

  const [dashboardAccess, setDashboardAccess] =
    useState<DashboardAccess>(defaultDashboardAccess);

  const [selectedSlug, setSelectedSlug] = useState("");

  const [loadedPropertyIdentifier, setLoadedPropertyIdentifier] =
    useState("");

  const [loadingSelectedProperty, setLoadingSelectedProperty] =
    useState(false);

  const latestLoadRequestId = useRef(0);

  const [propertyName, setPropertyName] = useState("");

  const [newProperty, setNewProperty] = useState("");

  const [isNewProperty, setIsNewProperty] =
    useState(false);

  const [loadingProperties, setLoadingProperties] =
    useState(true);

  const [saving, setSaving] = useState(false);

  const [city, setCity] = useState("");

  const [country, setCountry] = useState("");

  const [address, setAddress] = useState("");

  const [wifiName, setWifiName] = useState("");

  const [wifiPassword, setWifiPassword] = useState("");

  const [checkin, setCheckin] = useState("");

  const [checkout, setCheckout] = useState("");

  const [checkinNotes, setCheckinNotes] = useState("");

  const [lockboxCode, setLockboxCode] = useState("");

  const [emergencyNumbers, setEmergencyNumbers] =
    useState("");

  const [knowledgeBase, setKnowledgeBase] =
    useState<KnowledgeBase>(createEmptyKnowledgeBase);

  const [aiEnabled, setAiEnabled] = useState(true);

  const [whatsappEnabled, setWhatsappEnabled] =
    useState(false);

  const [telegramEnabled, setTelegramEnabled] =
    useState(false);

  const [welcomebookEnabled, setWelcomebookEnabled] =
    useState(true);

  const selectedProperty = useMemo(() => {
    return properties.find(
      (property) =>
        getPropertyIdentifier(property) === selectedSlug
    );
  }, [properties, selectedSlug]);

  const guestPageUrl = useMemo(() => {
    if (!selectedSlug) {
      return "";
    }

    return `/guest/${selectedSlug}`;
  }, [selectedSlug]);

  const isMalteseMaisonette = useMemo(() => {
    return (
      selectedSlug.includes("maltese-maisonette") ||
      propertyName
        .toLowerCase()
        .includes("maltese maisonette")
    );
  }, [selectedSlug, propertyName]);

  const isPartnerMode = useMemo(() => {
    return (
      dashboardAccess.isPartner ||
      dashboardAccess.role === "partner" ||
      !dashboardAccess.canCreateProperty ||
      !dashboardAccess.canDeleteProperty
    );
  }, [dashboardAccess]);

  const extraServices = knowledgeBase.extra_services;

  const heroPreviewTitle = useMemo(() => {
    return (
      knowledgeBase.guest_page.hero_title.trim() ||
      `Welcome to ${propertyName || "Your Stay"}`
    );
  }, [knowledgeBase.guest_page.hero_title, propertyName]);

  const aboutPreviewDescription = useMemo(() => {
    return (
      knowledgeBase.guest_page.about_description.trim() ||
      knowledgeBase.welcome_book.description.trim() ||
      "Add a warm, guest-friendly description of the apartment here."
    );
  }, [
    knowledgeBase.guest_page.about_description,
    knowledgeBase.welcome_book.description,
  ]);

  const commandGuestPageReady = Boolean(
    guestPageUrl &&
      heroPreviewTitle.trim() &&
      aboutPreviewDescription.trim()
  );

  const commandWelcomeReady = Boolean(
    welcomebookEnabled &&
      (knowledgeBase.welcome_book.description.trim() ||
        knowledgeBase.welcome_book.house_rules.trim() ||
        knowledgeBase.welcome_book.checkout_notes.trim())
  );

  const commandAiReady = Boolean(
    aiEnabled &&
      (knowledgeBase.ai_training.faq.trim() ||
        knowledgeBase.ai_training.troubleshooting.trim() ||
        knowledgeBase.ai_training.escalation_rules.trim())
  );

  const commandAccessReady = Boolean(
    wifiName.trim() ||
      wifiPassword.trim() ||
      checkin.trim() ||
      checkout.trim() ||
      checkinNotes.trim()
  );

  const commandExtraServicesReady = Boolean(
    extraServices.enabled &&
      (extraServices.title.trim() ||
        extraServices.intro.trim() ||
        extraServices.services.trim())
  );

  const commandLocationLabel = [city, country]
    .filter(Boolean)
    .join(", ");

  const canSaveSelectedProperty = Boolean(
    propertyName.trim() &&
      !saving &&
      !loadingSelectedProperty &&
      (!isNewProperty || dashboardAccess.canCreateProperty) &&
      (isNewProperty ||
        (selectedSlug &&
          loadedPropertyIdentifier &&
          loadedPropertyIdentifier === selectedSlug))
  );

  const saveStatusMessage = useMemo(() => {
    if (saving) {
      return "Saving...";
    }

    if (loadingSelectedProperty) {
      return "Loading selected property...";
    }

    if (!propertyName.trim()) {
      return "Property name is required";
    }

    if (isNewProperty && !dashboardAccess.canCreateProperty) {
      return "This account cannot create new properties";
    }

    if (
      !isNewProperty &&
      selectedSlug &&
      loadedPropertyIdentifier &&
      loadedPropertyIdentifier !== selectedSlug
    ) {
      return "Selected property changed. Wait for the correct property to load.";
    }

    if (!isNewProperty && selectedSlug && !loadedPropertyIdentifier) {
      return "Waiting for selected property data...";
    }

    return "Changes are ready to be saved";
  }, [
    saving,
    loadingSelectedProperty,
    propertyName,
    isNewProperty,
    dashboardAccess.canCreateProperty,
    selectedSlug,
    loadedPropertyIdentifier,
  ]);

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    if (!selectedSlug || isNewProperty) {
      return;
    }

    loadPropertyData(selectedSlug);
  }, [selectedSlug, isNewProperty]);

  function rememberSelectedProperty(value: string) {
    if (typeof window === "undefined") {
      return;
    }

    if (!value) {
      window.localStorage.removeItem(selectedPropertyStorageKey);
      return;
    }

    window.localStorage.setItem(
      selectedPropertyStorageKey,
      value
    );
  }

  function getRememberedPropertySlug() {
    if (typeof window === "undefined") {
      return "";
    }

    return (
      window.localStorage.getItem(
        selectedPropertyStorageKey
      ) || ""
    );
  }

  function selectProperty(value: string) {
    setSelectedSlug(value);
    setLoadedPropertyIdentifier("");
    rememberSelectedProperty(value);
  }

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

      setDashboardAccess(normalizeDashboardAccess(data.access));

      const loadedProperties =
        (data.properties || []) as Property[];

      setProperties(loadedProperties);

      if (loadedProperties.length === 0) {
        selectProperty("");
        resetForm();
        return;
      }

      const currentStillExists = loadedProperties.some(
        (property) =>
          getPropertyIdentifier(property) === selectedSlug
      );

      if (selectedSlug && currentStillExists) {
        rememberSelectedProperty(selectedSlug);
        return;
      }

      const rememberedSlug = getRememberedPropertySlug();

      const rememberedStillExists = loadedProperties.some(
        (property) =>
          getPropertyIdentifier(property) === rememberedSlug
      );

      if (rememberedSlug && rememberedStillExists) {
        setSelectedSlug(rememberedSlug);
        setLoadedPropertyIdentifier("");
        return;
      }

      const firstProperty = loadedProperties[0];

      selectProperty(getPropertyIdentifier(firstProperty));
    } catch (error) {
      console.error("LOAD PROPERTIES ERROR:", error);
      alert("Unable to load properties");
    } finally {
      setLoadingProperties(false);
    }
  }

  async function loadPropertyData(identifier: string) {
    const requestId = latestLoadRequestId.current + 1;
    latestLoadRequestId.current = requestId;

    try {
      setLoadingSelectedProperty(true);

      const response = await fetch(
        `/api/properties/${encodeURIComponent(identifier)}`
      );

      const data = await response.json();

      if (latestLoadRequestId.current !== requestId) {
        return;
      }

      if (!data.success) {
        throw new Error(
          data.error || "Unable to load property"
        );
      }

      const property = data.property as Property;
      const loadedIdentifier = getPropertyIdentifier(property);

      if (loadedIdentifier !== identifier) {
        throw new Error(
          "Loaded property does not match selected property"
        );
      }

      fillForm(property);
      setLoadedPropertyIdentifier(loadedIdentifier);
      rememberSelectedProperty(loadedIdentifier);
    } catch (error) {
      if (latestLoadRequestId.current === requestId) {
        console.error("LOAD PROPERTY ERROR:", error);
        alert("Unable to load selected property");
        setLoadedPropertyIdentifier("");
      }
    } finally {
      if (latestLoadRequestId.current === requestId) {
        setLoadingSelectedProperty(false);
      }
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
    if (!dashboardAccess.canCreateProperty) {
      alert("This account cannot create new properties.");
      return;
    }

    const cleanName = newProperty.trim();

    if (!cleanName) {
      alert("Enter a property name first");
      return;
    }

    const slug = createSlug(cleanName);

    selectProperty(slug);
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

  async function copyGuestUrl() {
    if (!guestPageUrl) {
      alert("Select a property first");
      return;
    }

    const absoluteUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${guestPageUrl}`
        : guestPageUrl;

    try {
      await navigator.clipboard.writeText(absoluteUrl);
      alert("Guest page URL copied");
    } catch (error) {
      console.error("COPY GUEST URL ERROR:", error);
      alert("Unable to copy guest page URL");
    }
  }

  function applyDefaultHeroImage() {
    updateGuestPage(
      "hero_image_url",
      malteseMaisonetteHeroImage
    );

    alert("Default hero image applied. Review and save when ready.");
  }

  function applyPremiumGuestCopy() {
    const cleanName = propertyName.trim() || "Your Stay";
    const cleanCity = city.trim() || "the local area";

    setKnowledgeBase((current) => ({
      ...current,
      guest_page: {
        ...current.guest_page,
        hero_title: `Welcome to ${cleanName}`,
        hero_intro: `A warm, comfortable and thoughtfully prepared stay in ${cleanCity}, designed to make your visit simple, relaxed and memorable.`,
        hero_image_url:
          current.guest_page.hero_image_url ||
          (isMalteseMaisonette
            ? malteseMaisonetteHeroImage
            : ""),
        about_title: "About this stay",
        about_intro:
          "A private and comfortable space designed to help you feel at home from the moment you arrive.",
        about_description: `This property offers a practical and welcoming base for your stay in ${cleanCity}. Inside, guests will find the essential comforts needed for a smooth visit, including a comfortable sleeping area, useful home amenities, WiFi, practical arrival information and local tips available through the digital guest page. The space is designed to be easy to use, easy to settle into and convenient for guests who want a simple, independent and well-supported stay.`,
        about_highlights:
          "Private guest space\nComfortable stay experience\nWiFi and practical essentials\nLocal tips and AI Concierge support",
      },
    }));

    alert("Premium guest page copy applied. Review and save when ready.");
  }

  function applyMalteseMaisonetteGuestCopy() {
    setKnowledgeBase((current) => ({
      ...current,
      guest_page: {
        ...current.guest_page,
        hero_title: "Welcome to Maltese Maisonette",
        hero_intro:
          "A cozy Maltese maisonette in central Sliema, designed for a simple, comfortable and authentic stay by the sea.",
        hero_image_url: malteseMaisonetteHeroImage,
        about_title: "About this stay",
        about_intro:
          "This private one-bedroom maisonette gives you the feeling of a traditional Maltese home, with the comfort and independence of having the entire place to yourself.",
        about_description:
          "Inside, you’ll find a queen-size bedroom with A/C, a living area with sofa, a fully equipped kitchen, a bathroom with shower and washing machine, high-speed WiFi, a desk for work or study, and a small outdoor space. The apartment is set on a quiet Maltese street in central Sliema, close to the promenade, cafés, shops, public transport, Balluta Bay and St Julian’s nightlife. It is ideal for guests who want a central location, practical comfort and an authentic local base while staying in Malta.",
        about_highlights:
          "Private one-bedroom maisonette\nCentral Sliema location\n100m from the promenade\nHigh-speed WiFi and desk\nKitchen and washing machine\nA/C in the bedroom",
      },
    }));

    alert("Maltese Maisonette guest page copy applied. Review and save when ready.");
  }

  function applyExtraServicesTemplate() {
    setKnowledgeBase((current) => ({
      ...current,
      extra_services: {
        ...current.extra_services,
        title: "Extra Services",
        intro:
          "Enhance your stay with selected local services and trusted partner recommendations. Availability may vary, so please contact the host before booking.",
        services:
          "Airport transfer — Available on request, subject to availability and price confirmation\nScooter rental — Local partner options can be shared on request\nCar rental — Recommended providers available nearby\nBoat trips & excursions — Seasonal tours and local experiences can be recommended\nMassage or wellness services — Available with advance booking when possible\nLate checkout — Subject to availability and host approval\nLuggage storage — Ask the host for available options",
        host_note:
          "Internal note: add partner contacts, prices, commissions, availability rules and services that require manual host approval.",
      },
    }));

    alert("Extra Services template applied. Review, enable and save when ready.");
  }

  async function save() {
    if (!propertyName.trim()) {
      alert("Property name is required");
      return;
    }

    if (isNewProperty && !dashboardAccess.canCreateProperty) {
      alert("This account cannot create new properties.");
      return;
    }

    if (loadingSelectedProperty) {
      alert("Please wait until the selected property has finished loading.");
      return;
    }

    if (
      !isNewProperty &&
      (!selectedSlug ||
        !loadedPropertyIdentifier ||
        loadedPropertyIdentifier !== selectedSlug)
    ) {
      alert(
        "The selected property is not fully loaded yet. Please wait before saving to avoid overwriting another property."
      );
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
        knowledgeBase.local_guide.neighbourhood_overview,
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

      const savedProperty = data.property as Property;
      const savedIdentifier =
        savedProperty.slug || savedProperty.id || slug;

      alert("Property saved successfully");

      setIsNewProperty(false);
      selectProperty(savedIdentifier);
      setLoadedPropertyIdentifier(savedIdentifier);

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
    if (!dashboardAccess.canDeleteProperty) {
      alert("This account cannot delete properties.");
      return;
    }

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

      selectProperty("");
      setLoadedPropertyIdentifier("");
      setIsNewProperty(false);
      resetForm();
      await loadProperties();
    } catch (error) {
      console.error("DELETE PROPERTY ERROR:", error);
      alert("Error deleting property");
    }
  }

  function updateGuestPage(
    field: keyof GuestPageContent,
    value: string
  ) {
    setKnowledgeBase((current) => ({
      ...current,
      guest_page: {
        ...current.guest_page,
        [field]: value,
      },
    }));
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

  function updateExtraServices(
    field: keyof ExtraServices,
    value: string | boolean
  ) {
    setKnowledgeBase((current) => ({
      ...current,
      extra_services: {
        ...current.extra_services,
        [field]: value,
      },
    }));
  }

  function updateLocalGuide(
    field: keyof LocalGuide,
    value: string
  ) {
    setKnowledgeBase((current) => ({
      ...current,
      local_guide: {
        ...current.local_guide,
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

              {isPartnerMode && (
                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 border border-emerald-300/20 px-4 py-2 text-sm text-emerald-100">
                  <span>Limited Partner Access</span>
                  <span className="text-white/40">•</span>
                  <span>Assigned properties only</span>
                </div>
              )}
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
        <DashboardCommandCenter
          propertyName={propertyName}
          propertiesCount={properties.length}
          aiEnabled={aiEnabled}
          commandLocationLabel={commandLocationLabel}
          guestPageUrl={guestPageUrl}
          loadingSelectedProperty={loadingSelectedProperty}
          commandGuestPageReady={commandGuestPageReady}
          commandWelcomeReady={commandWelcomeReady}
          commandAiReady={commandAiReady}
          commandAccessReady={commandAccessReady}
          commandExtraServicesReady={commandExtraServicesReady}
          extraServicesEnabled={extraServices.enabled}
          wifiName={wifiName}
          wifiPassword={wifiPassword}
          onCopyWifi={copyWifi}
          onCopyGuestUrl={copyGuestUrl}
        />

        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          <DashboardSidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
          />

          <div className="space-y-8">
            {activeTab === "guestpage" && (
              <DashboardGuestPageTab
                propertyName={propertyName}
                city={city}
                country={country}
                checkin={checkin}
                checkout={checkout}
                guestPageUrl={guestPageUrl}
                knowledgeBase={knowledgeBase}
                isMalteseMaisonette={isMalteseMaisonette}
                malteseMaisonetteHeroImage={malteseMaisonetteHeroImage}
                onCopyGuestUrl={copyGuestUrl}
                onApplyDefaultHeroImage={applyDefaultHeroImage}
                onApplyPremiumGuestCopy={applyPremiumGuestCopy}
                onApplyMalteseMaisonetteGuestCopy={applyMalteseMaisonetteGuestCopy}
                onUpdateGuestPage={updateGuestPage}
              />
            )}

            {activeTab === "general" && (
              <DashboardGeneralTab
                properties={properties}
                selectedSlug={selectedSlug}
                loadingProperties={loadingProperties}
                propertyName={propertyName}
                newProperty={newProperty}
                city={city}
                country={country}
                address={address}
                wifiName={wifiName}
                wifiPassword={wifiPassword}
                checkin={checkin}
                checkout={checkout}
                checkinNotes={checkinNotes}
                lockboxCode={lockboxCode}
                emergencyNumbers={emergencyNumbers}
                knowledgeBase={knowledgeBase}
                aiEnabled={aiEnabled}
                whatsappEnabled={whatsappEnabled}
                telegramEnabled={telegramEnabled}
                welcomebookEnabled={welcomebookEnabled}
                canCreateProperty={dashboardAccess.canCreateProperty}
                canDeleteProperty={dashboardAccess.canDeleteProperty}
                accessRole={dashboardAccess.role}
                onSelectProperty={(value) => {
                  setIsNewProperty(false);
                  selectProperty(value);
                }}
                onDeleteProperty={deleteProperty}
                onAddProperty={addProperty}
                onCopyWifi={copyWifi}
                onCopyGuestUrl={copyGuestUrl}
                onSetPropertyName={setPropertyName}
                onSetNewProperty={setNewProperty}
                onSetCity={setCity}
                onSetCountry={setCountry}
                onSetAddress={setAddress}
                onSetWifiName={setWifiName}
                onSetWifiPassword={setWifiPassword}
                onSetCheckin={setCheckin}
                onSetCheckout={setCheckout}
                onSetCheckinNotes={setCheckinNotes}
                onSetLockboxCode={setLockboxCode}
                onSetEmergencyNumbers={setEmergencyNumbers}
                onSetAiEnabled={setAiEnabled}
                onSetWhatsappEnabled={setWhatsappEnabled}
                onSetTelegramEnabled={setTelegramEnabled}
                onSetWelcomebookEnabled={setWelcomebookEnabled}
                onUpdateWelcomeBook={updateWelcomeBook}
                onUpdateLocalGuide={updateLocalGuide}
                onUpdateExtraServices={updateExtraServices}
              />
            )}

            {activeTab === "extraservices" && (
              <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
                <SectionHeader
                  icon="🛎️"
                  title="Extra Services / Upselling"
                  description="Optional guest-facing services, partner offers and upselling opportunities. Keep this disabled until you have real services to show."
                />

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
                        updateExtraServices(
                          "enabled",
                          !knowledgeBase.extra_services.enabled
                        )
                      }
                      className={`w-full rounded-3xl border px-6 py-5 text-left transition ${
                        knowledgeBase.extra_services.enabled
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-900 border-gray-200"
                      }`}
                    >
                      <div className="font-bold mb-1">
                        Show Extra Services on Guest Page
                      </div>

                      <div
                        className={`text-sm ${
                          knowledgeBase.extra_services.enabled
                            ? "text-white/60"
                            : "text-gray-500"
                        }`}
                      >
                        {knowledgeBase.extra_services.enabled
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
                    <FieldLabel
                      title="Section title"
                      description="Guest-facing title shown on the guest page."
                    />

                    <input
                      className="w-full border border-gray-200 rounded-2xl p-4"
                      placeholder="Extra Services"
                      value={knowledgeBase.extra_services.title}
                      onChange={(event) =>
                        updateExtraServices(
                          "title",
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <TextArea
                    placeholder="Guest intro. Short intro shown to guests above the services list."
                    value={knowledgeBase.extra_services.intro}
                    onChange={(value) =>
                      updateExtraServices("intro", value)
                    }
                  />

                  <TextArea
                    placeholder="Services and offers. Add one service per line. Example: Airport transfer — Contact host for availability and price."
                    value={knowledgeBase.extra_services.services}
                    onChange={(value) =>
                      updateExtraServices("services", value)
                    }
                    large
                  />

                  <TextArea
                    placeholder="Internal host note. Add partner contacts, prices, commissions, availability rules and services that require manual host approval. This is not shown to guests."
                    value={knowledgeBase.extra_services.host_note}
                    onChange={(value) =>
                      updateExtraServices("host_note", value)
                    }
                  />
                </div>
              </section>
            )}

            {activeTab === "welcomebook" && (
              <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
                <SectionHeader
                  icon="📘"
                  title="Welcome Book"
                  description="House manual and practical apartment information visible to guests during their stay."
                />

                <div className="space-y-5">
                  <TextArea
                    placeholder="Amenities. Amenities available in the apartment."
                    value={knowledgeBase.welcome_book.amenities}
                    onChange={(value) =>
                      updateWelcomeBook("amenities", value)
                    }
                  />

                  <TextArea
                    placeholder="General apartment instructions. Add general instructions guests should follow while using the apartment."
                    value={knowledgeBase.welcome_book.apartment_instructions}
                    onChange={(value) =>
                      updateWelcomeBook(
                        "apartment_instructions",
                        value
                      )
                    }
                  />

                  <TextArea
                    placeholder="Kitchen instructions. Add appliances, basic supplies and usage notes."
                    value={knowledgeBase.welcome_book.kitchen}
                    onChange={(value) =>
                      updateWelcomeBook("kitchen", value)
                    }
                  />

                  <TextArea
                    placeholder="Washing machine instructions. Explain how guests can use the washing machine."
                    value={knowledgeBase.welcome_book.washing_machine}
                    onChange={(value) =>
                      updateWelcomeBook(
                        "washing_machine",
                        value
                      )
                    }
                  />

                  <TextArea
                    placeholder="Air conditioning instructions. Explain how guests should use the air conditioning."
                    value={knowledgeBase.welcome_book.ac}
                    onChange={(value) =>
                      updateWelcomeBook("ac", value)
                    }
                  />

                  <TextArea
                    placeholder="Boiler / hot water instructions. Explain anything guests should know about hot water."
                    value={knowledgeBase.welcome_book.boiler}
                    onChange={(value) =>
                      updateWelcomeBook("boiler", value)
                    }
                  />

                  <TextArea
                    placeholder="Trash and recycling instructions. Explain rubbish collection, recycling rules and check-out rubbish instructions."
                    value={knowledgeBase.welcome_book.trash}
                    onChange={(value) =>
                      updateWelcomeBook("trash", value)
                    }
                  />

                  <TextArea
                    placeholder="Towels and linen instructions. Explain provided towels, linen and extra towel rules."
                    value={knowledgeBase.welcome_book.towels_linen}
                    onChange={(value) =>
                      updateWelcomeBook(
                        "towels_linen",
                        value
                      )
                    }
                  />

                  <TextArea
                    placeholder="Beach towels instructions. Explain where beach towels are located and how guests may use them."
                    value={knowledgeBase.welcome_book.beach_towels}
                    onChange={(value) =>
                      updateWelcomeBook(
                        "beach_towels",
                        value
                      )
                    }
                  />

                  <TextArea
                    placeholder="Parking information. Explain parking availability, limitations and useful parking notes."
                    value={knowledgeBase.welcome_book.parking}
                    onChange={(value) =>
                      updateWelcomeBook("parking", value)
                    }
                  />

                  <TextArea
                    placeholder="Emergency information. Add emergency information visible to guests."
                    value={knowledgeBase.welcome_book.emergency}
                    onChange={(value) =>
                      updateWelcomeBook("emergency", value)
                    }
                  />

                  <TextArea
                    placeholder="Extra house notes. Add extra notes specific to this property."
                    value={knowledgeBase.welcome_book.extra_notes}
                    onChange={(value) =>
                      updateWelcomeBook("extra_notes", value)
                    }
                    large
                  />
                </div>
              </section>
            )}

            {activeTab === "localguide" && (
              <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
                <SectionHeader
                  icon="📍"
                  title="Local Guide"
                  description="Local recommendations and area information for guests: restaurants, bars, beaches, transport and things to do."
                />

                <div className="space-y-5">
                  <TextArea
                    placeholder="Neighbourhood overview. Explain the area, atmosphere, nearby landmarks and what guests should know."
                    value={knowledgeBase.local_guide.neighbourhood_overview}
                    onChange={(value) =>
                      updateLocalGuide(
                        "neighbourhood_overview",
                        value
                      )
                    }
                  />

                  <TextArea
                    placeholder="Restaurants. Add recommended places to eat nearby."
                    value={knowledgeBase.local_guide.restaurants}
                    onChange={(value) =>
                      updateLocalGuide(
                        "restaurants",
                        value
                      )
                    }
                  />

                  <TextArea
                    placeholder="Breakfast and coffee. Add cafés, bakeries and breakfast spots."
                    value={knowledgeBase.local_guide.breakfast_coffee}
                    onChange={(value) =>
                      updateLocalGuide(
                        "breakfast_coffee",
                        value
                      )
                    }
                  />

                  <TextArea
                    placeholder="Bars. Add cocktail bars, wine bars, pubs or nightlife recommendations."
                    value={knowledgeBase.local_guide.bars}
                    onChange={(value) =>
                      updateLocalGuide("bars", value)
                    }
                  />

                  <TextArea
                    placeholder="Beaches. Add nearby beaches, swimming spots, rocky beaches and beach clubs."
                    value={knowledgeBase.local_guide.beaches}
                    onChange={(value) =>
                      updateLocalGuide("beaches", value)
                    }
                  />

                  <TextArea
                    placeholder="Things to visit. Add attractions, sightseeing ideas, day trips and cultural places."
                    value={knowledgeBase.local_guide.things_to_visit}
                    onChange={(value) =>
                      updateLocalGuide(
                        "things_to_visit",
                        value
                      )
                    }
                  />

                  <TextArea
                    placeholder="Transport and getting around. Add airport transfer, buses, ferries, Bolt/Uber, taxis and walking tips."
                    value={knowledgeBase.local_guide.transport_getting_around}
                    onChange={(value) =>
                      updateLocalGuide(
                        "transport_getting_around",
                        value
                      )
                    }
                  />

                  <TextArea
                    placeholder="Useful services. Add supermarkets, pharmacies, clinics, ATMs, laundry, gyms or other practical services."
                    value={knowledgeBase.local_guide.useful_services}
                    onChange={(value) =>
                      updateLocalGuide(
                        "useful_services",
                        value
                      )
                    }
                  />

                  <TextArea
                    placeholder="Host recommendations. Add your personal favourites and practical tips."
                    value={knowledgeBase.local_guide.host_recommendations}
                    onChange={(value) =>
                      updateLocalGuide(
                        "host_recommendations",
                        value
                      )
                    }
                    large
                  />
                </div>
              </section>
            )}

            {activeTab === "ai" && (
              <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
                <SectionHeader
                  icon="🤖"
                  title="AI Training"
                  description="Internal instructions used by the AI concierge. These notes help the assistant answer correctly and escalate when needed."
                />

                <div className="space-y-5">
                  <TextArea
                    placeholder="FAQs. Add common guest questions and preferred answers."
                    value={knowledgeBase.ai_training.faq}
                    onChange={(value) =>
                      updateAiTraining("faq", value)
                    }
                  />

                  <TextArea
                    placeholder="Troubleshooting. Add instructions for common apartment issues such as Wi-Fi, AC, hot water, keys, access or appliances."
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
                    placeholder="Guest communication style. Explain tone, language, length of answers and hospitality style."
                    value={knowledgeBase.ai_training.guest_style}
                    onChange={(value) =>
                      updateAiTraining(
                        "guest_style",
                        value
                      )
                    }
                  />

                  <TextArea
                    placeholder="Complaint handling. Explain how the AI should respond to complaints, unhappy guests or sensitive situations."
                    value={knowledgeBase.ai_training.complaint_handling}
                    onChange={(value) =>
                      updateAiTraining(
                        "complaint_handling",
                        value
                      )
                    }
                  />

                  <TextArea
                    placeholder="Escalation rules. Explain when the AI should tell the guest to contact the host immediately."
                    value={knowledgeBase.ai_training.escalation_rules}
                    onChange={(value) =>
                      updateAiTraining(
                        "escalation_rules",
                        value
                      )
                    }
                  />

                  <TextArea
                    placeholder="Hidden operational notes. Internal host notes that should guide the AI but should not be shown directly to guests."
                    value={knowledgeBase.ai_training.hidden_notes}
                    onChange={(value) =>
                      updateAiTraining(
                        "hidden_notes",
                        value
                      )
                    }
                  />

                  <TextArea
                    placeholder="Additional AI notes. Add any additional instruction for the AI concierge."
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

      <DashboardSaveBar
        propertyName={propertyName}
        saveStatusMessage={saveStatusMessage}
        saving={saving}
        canSave={canSaveSelectedProperty}
        onSave={save}
      />
    </div>
  );
}