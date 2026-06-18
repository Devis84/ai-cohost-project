"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Input, Select, TextArea, Toggle } from "@/components/ui";
import { SaveBar } from "@/components/molecules/SaveBar";
import { DashboardHeader } from "@/components/organisms/DashboardHeader";
import {
  Home, BookOpen, Bot, Star, MapPin as MapPinIcon,
  MapPin, Wifi, Key, Settings, AlertCircle,
} from "lucide-react";

type GuestPageContent = {
  hero_title: string;
  hero_intro: string;
  hero_image_url: string;
  about_title: string;
  about_intro: string;
  about_description: string;
  about_highlights: string;
};

type WelcomeBook = {
  description: string;
  amenities: string;
  house_rules: string;
  apartment_instructions: string;
  kitchen: string;
  washing_machine: string;
  ac: string;
  boiler: string;
  trash: string;
  towels_linen: string;
  beach_towels: string;
  parking: string;
  emergency: string;
  checkout_notes: string;
  extra_notes: string;
  restaurants: string;
  transport: string;
  local_guide: string;
};

type ExtraServices = {
  enabled: boolean;
  title: string;
  intro: string;
  services: string;
  host_note: string;
};

type LocalGuide = {
  neighbourhood_overview: string;
  restaurants: string;
  breakfast_coffee: string;
  bars: string;
  beaches: string;
  things_to_visit: string;
  transport_getting_around: string;
  useful_services: string;
  host_recommendations: string;
};

type AiTraining = {
  faq: string;
  troubleshooting: string;
  guest_style: string;
  complaint_handling: string;
  escalation_rules: string;
  hidden_notes: string;
  additional_notes: string;
};

type KnowledgeBase = {
  guest_page: GuestPageContent;
  welcome_book: WelcomeBook;
  extra_services: ExtraServices;
  local_guide: LocalGuide;
  ai_training: AiTraining;
};

type StoredKnowledgeBase = {
  guest_page?: Partial<GuestPageContent>;
  welcome_book?: Partial<WelcomeBook>;
  extra_services?: Partial<ExtraServices>;
  local_guide?: Partial<LocalGuide>;
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

const malteseMaisonetteHeroImage =
  "/guest-images/maltese-maisonette-hero-bedroom.jpg";

const selectedPropertyStorageKey =
  "ai_cohost_selected_property_slug";

function createEmptyKnowledgeBase(): KnowledgeBase {
  return {
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
      apartment_instructions: "",
      kitchen: "",
      washing_machine: "",
      ac: "",
      boiler: "",
      trash: "",
      towels_linen: "",
      beach_towels: "",
      parking: "",
      emergency: "",
      checkout_notes: "",
      extra_notes: "",
      restaurants: "",
      transport: "",
      local_guide: "",
    },

    extra_services: {
      enabled: false,
      title: "Extra Services",
      intro: "",
      services: "",
      host_note: "",
    },

    local_guide: {
      neighbourhood_overview: "",
      restaurants: "",
      breakfast_coffee: "",
      bars: "",
      beaches: "",
      things_to_visit: "",
      transport_getting_around: "",
      useful_services: "",
      host_recommendations: "",
    },

    ai_training: {
      faq: "",
      troubleshooting: "",
      guest_style: "",
      complaint_handling: "",
      escalation_rules: "",
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

function splitHighlights(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getPropertyIdentifier(property: Property) {
  return property.slug || property.id;
}

function mergeKnowledgeBase(property: Property): KnowledgeBase {
  const empty = createEmptyKnowledgeBase();

  const savedGuestPage: Partial<GuestPageContent> =
    property.knowledge_base?.guest_page || {};

  const savedWelcome: Partial<WelcomeBook> =
    property.knowledge_base?.welcome_book || {};

  const savedExtraServices: Partial<ExtraServices> =
    property.knowledge_base?.extra_services || {};

  const savedLocalGuide: Partial<LocalGuide> =
    property.knowledge_base?.local_guide || {};

  const savedAi: Partial<AiTraining> =
    property.knowledge_base?.ai_training || {};

  return {
    guest_page: {
      ...empty.guest_page,
      ...savedGuestPage,
      hero_title:
        savedGuestPage.hero_title ||
        safeString(property.property_name),
      hero_intro: savedGuestPage.hero_intro || "",
      hero_image_url:
        savedGuestPage.hero_image_url || "",
      about_title:
        savedGuestPage.about_title || "About this stay",
      about_intro: savedGuestPage.about_intro || "",
      about_description:
        savedGuestPage.about_description ||
        safeString(savedWelcome.description) ||
        safeString(property.description),
      about_highlights:
        savedGuestPage.about_highlights || "",
    },

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
      emergency:
        savedWelcome.emergency ||
        safeString(property.emergency_info),
    },

    extra_services: {
      ...empty.extra_services,
      ...savedExtraServices,
      enabled: Boolean(savedExtraServices.enabled),
      title:
        savedExtraServices.title ||
        empty.extra_services.title,
      intro: savedExtraServices.intro || "",
      services: savedExtraServices.services || "",
      host_note: savedExtraServices.host_note || "",
    },

    local_guide: {
      ...empty.local_guide,
      ...savedLocalGuide,
      neighbourhood_overview:
        savedLocalGuide.neighbourhood_overview ||
        safeString(property.local_info),
      restaurants:
        savedLocalGuide.restaurants ||
        safeString(savedWelcome.restaurants),
      transport_getting_around:
        savedLocalGuide.transport_getting_around ||
        safeString(savedWelcome.transport),
      host_recommendations:
        savedLocalGuide.host_recommendations ||
        safeString(savedWelcome.local_guide),
    },

    ai_training: {
      ...empty.ai_training,
      ...savedAi,
      faq: savedAi.faq || safeString(property.ai_knowledge),
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

  const [loadedPropertyIdentifier, setLoadedPropertyIdentifier] =
    useState("");

  const [loadingSelectedProperty, setLoadingSelectedProperty] =
    useState(false);

  const latestLoadRequestId = useRef(0);

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

  const guestPage = knowledgeBase.guest_page;

  const heroPreviewImage = useMemo(() => {
    if (guestPage.hero_image_url.trim()) {
      return guestPage.hero_image_url.trim();
    }
    if (isMalteseMaisonette) {
      return malteseMaisonetteHeroImage;
    }
    return "";
  }, [guestPage.hero_image_url, isMalteseMaisonette]);

  const heroPreviewTitle = useMemo(() => {
    return (
      guestPage.hero_title.trim() ||
      `Welcome to ${propertyName || "Your Stay"}`
    );
  }, [guestPage.hero_title, propertyName]);

  const heroPreviewIntro = useMemo(() => {
    return (
      guestPage.hero_intro.trim() ||
      "A comfortable private stay with everything you need in one place."
    );
  }, [guestPage.hero_intro]);

  const aboutPreviewTitle = useMemo(() => {
    return guestPage.about_title.trim() || "About this stay";
  }, [guestPage.about_title]);

  const aboutPreviewIntro = useMemo(() => {
    return (
      guestPage.about_intro.trim() ||
      "A private stay designed to make your visit simple, comfortable and easy to manage."
    );
  }, [guestPage.about_intro]);

  const aboutPreviewDescription = useMemo(() => {
    return (
      guestPage.about_description.trim() ||
      knowledgeBase.welcome_book.description.trim() ||
      "Add a warm, guest-friendly description of the apartment here."
    );
  }, [
    guestPage.about_description,
    knowledgeBase.welcome_book.description,
  ]);

  const aboutPreviewHighlights = useMemo(() => {
    const items = splitHighlights(guestPage.about_highlights);
    if (items.length > 0) {
      return items;
    }
    return [
      "Private guest space",
      "Useful stay information",
      "AI Concierge support",
      "Local tips and essentials",
    ];
  }, [guestPage.about_highlights]);

  const canSaveSelectedProperty = Boolean(
    propertyName.trim() &&
      !saving &&
      !loadingSelectedProperty &&
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
    window.localStorage.setItem(selectedPropertyStorageKey, value);
  }

  function getRememberedPropertySlug() {
    if (typeof window === "undefined") {
      return "";
    }
    return (
      window.localStorage.getItem(selectedPropertyStorageKey) || ""
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
        throw new Error(data.error || "Unable to load properties");
      }

      const loadedProperties =
        (data.properties || []) as Property[];

      setProperties(loadedProperties);

      if (loadedProperties.length === 0) {
        selectProperty("");
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
        throw new Error(data.error || "Unable to load property");
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
    setCheckinNotes(property.checkin_instructions || "");

    setLockboxCode(property.lockbox_code || "");
    setEmergencyNumbers(property.emergency_numbers || "");

    setKnowledgeBase(mergeKnowledgeBase(property));

    setAiEnabled(property.ai_enabled ?? true);
    setWhatsappEnabled(property.whatsapp_enabled ?? false);
    setTelegramEnabled(property.telegram_enabled ?? false);
    setWelcomebookEnabled(property.welcomebook_enabled ?? true);
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
    updateGuestPage("hero_image_url", malteseMaisonetteHeroImage);
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
          (isMalteseMaisonette ? malteseMaisonetteHeroImage : ""),
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
          "Inside, you'll find a queen-size bedroom with A/C, a living area with sofa, a fully equipped kitchen, a bathroom with shower and washing machine, high-speed WiFi, a desk for work or study, and a small outdoor space. The apartment is set on a quiet Maltese street in central Sliema, close to the promenade, cafés, shops, public transport, Balluta Bay and St Julian's nightlife. It is ideal for guests who want a central location, practical comfort and an authentic local base while staying in Malta.",
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

      house_rules: knowledgeBase.welcome_book.house_rules,
      description: knowledgeBase.welcome_book.description,
      amenities: knowledgeBase.welcome_book.amenities,
      parking_info: knowledgeBase.welcome_book.parking,
      local_info: knowledgeBase.local_guide.neighbourhood_overview,
      emergency_info: knowledgeBase.welcome_book.emergency,
      ai_knowledge: knowledgeBase.ai_training.faq,

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
        throw new Error(data.error || "Unable to save property");
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
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Unable to delete property");
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

  const propertyOptions = properties.map((property) => ({
    value: getPropertyIdentifier(property),
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

      <div className="flex flex-wrap gap-3 mt-6 mb-8">
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
          onClick={() => setActiveTab("guestpage")}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            activeTab === "guestpage"
              ? "bg-primary text-on-primary"
              : "bg-surface-container-lowest border border-outline/30 text-on-surface"
          }`}
        >
          <Star size={16} className="inline mr-2" />
          Guest Page
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
          onClick={() => setActiveTab("extraservices")}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            activeTab === "extraservices"
              ? "bg-primary text-on-primary"
              : "bg-surface-container-lowest border border-outline/30 text-on-surface"
          }`}
        >
          <Settings size={16} className="inline mr-2" />
          Extra Services
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("localguide")}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            activeTab === "localguide"
              ? "bg-primary text-on-primary"
              : "bg-surface-container-lowest border border-outline/30 text-on-surface"
          }`}
        >
          <MapPinIcon size={16} className="inline mr-2" />
          Local Guide
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
                    selectProperty(event.target.value);
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

                  <button
                    type="button"
                    onClick={copyGuestUrl}
                    className="bg-surface-container hover:bg-surface-container-high px-5 py-3 rounded-2xl text-sm font-semibold"
                  >
                    Copy Guest URL
                  </button>

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

                <div className="bg-surface-container-lowest rounded-2xl p-5">
                  <Toggle
                    label="Extra Services"
                    checked={knowledgeBase.extra_services.enabled}
                    onChange={(checked) =>
                      updateExtraServices("enabled", checked)
                    }
                  />
                </div>
              </div>
            </Card>
          </>
        )}

        {activeTab === "guestpage" && (
          <>
            <Card variant="white" padding="p-7" border>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Star size={24} /> Guest Page Experience
                </h2>
              </div>

              <p className="text-outline mb-6 leading-relaxed">
                Control the first impression guests see when they scan your QR/NFC link. Use a short emotional intro, a strong hero image and a clear About This Stay section.
              </p>

              <div className="grid md:grid-cols-2 gap-4 mb-5">
                <div className="bg-surface-container-lowest rounded-2xl p-5">
                  <div className="text-outline text-sm mb-2">Guest page URL</div>
                  <div className="font-bold break-all text-on-surface">
                    {guestPageUrl || "Select a property first"}
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl p-5">
                  <div className="text-outline text-sm mb-2">Style goal</div>
                  <div className="font-bold text-on-surface">
                    Premium, mobile-first, emotional and credible
                  </div>
                </div>
              </div>

              {guestPageUrl && (
                <div className="flex flex-wrap gap-3 mb-6">
                  <Button variant="primary" onClick={copyGuestUrl}>
                    Copy Guest URL
                  </Button>

                  <a
                    href={guestPageUrl}
                    target="_blank"
                    className="bg-surface-container hover:bg-surface-container-high px-5 py-3 rounded-2xl text-sm font-semibold"
                  >
                    Open Guest Page
                  </a>

                  <a
                    href="/dashboard/qr"
                    className="bg-surface-container hover:bg-surface-container-high px-5 py-3 rounded-2xl text-sm font-semibold"
                  >
                    Manage QR/NFC
                  </a>
                </div>
              )}

              <div className="flex flex-wrap gap-3 mb-6">
                <Button variant="primary" onClick={applyPremiumGuestCopy}>
                  Generate Premium Copy
                </Button>

                <Button variant="secondary" onClick={applyMalteseMaisonetteGuestCopy}>
                  Use Maltese Maisonette Copy
                </Button>

                <Button variant="secondary" onClick={applyDefaultHeroImage}>
                  Apply Default Image
                </Button>
              </div>

              <div className="grid lg:grid-cols-[1fr_0.95fr] gap-8">
                <div>
                  <h3 className="text-lg font-bold mb-1 text-on-surface">Hero Section</h3>
                  <p className="text-outline text-sm mb-5 leading-relaxed">
                    This is the top section of the guest page. Keep it short, emotional and visual. Do not paste the full Airbnb description here.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4 mb-5">
                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-1">
                        Hero title
                      </label>
                      <p className="text-xs text-outline mb-2 leading-relaxed">
                        Main headline shown on the guest page. Usually the property name or a warmer welcome title.
                      </p>
                      <Input
                        placeholder="Example: Welcome to Maltese Maisonette"
                        value={knowledgeBase.guest_page.hero_title}
                        onChange={(event) =>
                          updateGuestPage("hero_title", event.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-1">
                        Hero image URL
                      </label>
                      <p className="text-xs text-outline mb-2 leading-relaxed">
                        Use a public image URL or a local image path such as /guest-images/maltese-maisonette-hero-bedroom.jpg
                      </p>
                      <Input
                        placeholder={malteseMaisonetteHeroImage}
                        value={knowledgeBase.guest_page.hero_image_url}
                        onChange={(event) =>
                          updateGuestPage("hero_image_url", event.target.value)
                        }
                      />
                    </div>
                  </div>

                  <TextArea
                    placeholder="Hero intro — short emotional intro shown in the hero. Keep this around 1–2 lines."
                    value={knowledgeBase.guest_page.hero_intro}
                    onChange={(e) =>
                      updateGuestPage("hero_intro", e.target.value)
                    }
                    className="mb-5"
                  />

                  <div className="border-t border-outline/20 pt-6 mt-2">
                    <h3 className="text-lg font-bold mb-1 text-on-surface">About This Stay</h3>
                    <p className="text-outline text-sm mb-5 leading-relaxed">
                      This section sits below the hero and gives guests a richer, more complete description of the apartment without overloading the first screen.
                    </p>

                    <div className="mb-5">
                      <label className="block text-sm font-bold text-on-surface mb-1">
                        Section title
                      </label>
                      <p className="text-xs text-outline mb-2">
                        Usually &quot;About this stay&quot;, but you can customize it.
                      </p>
                      <Input
                        placeholder="About this stay"
                        value={knowledgeBase.guest_page.about_title}
                        onChange={(event) =>
                          updateGuestPage("about_title", event.target.value)
                        }
                      />
                    </div>

                    <TextArea
                      placeholder="About intro — short premium intro, 1–2 sentences. This should feel warm and emotional."
                      value={knowledgeBase.guest_page.about_intro}
                      onChange={(e) =>
                        updateGuestPage("about_intro", e.target.value)
                      }
                      className="mb-5"
                    />

                    <TextArea
                      placeholder="About description — add the full guest-friendly apartment description. This can include bedroom, kitchen, WiFi, location, nearby promenade, cafés, transport and other practical details."
                      value={knowledgeBase.guest_page.about_description}
                      onChange={(e) =>
                        updateGuestPage("about_description", e.target.value)
                      }
                      minHeight="min-h-[220px]"
                      className="mb-5"
                    />

                    <TextArea
                      placeholder="Highlights — add one highlight per line. These will be shown as short premium bullet points on the guest page."
                      value={knowledgeBase.guest_page.about_highlights}
                      onChange={(e) =>
                        updateGuestPage("about_highlights", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="lg:sticky lg:top-8 h-fit">
                  <div className="rounded-[32px] overflow-hidden bg-surface-container-lowest text-on-surface shadow-2xl border border-outline/20">
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

                      <div className="relative p-6 min-h-[360px] flex flex-col justify-between text-white">
                        <div>
                          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-3 py-2 text-xs text-white/90 mb-4 backdrop-blur-md">
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
                              {city}{country ? `, ${country}` : ""}
                            </div>
                          )}
                          {checkin && (
                            <div className="bg-white/15 border border-white/20 rounded-full px-3 py-2 text-xs backdrop-blur-md">
                              Check-in: {checkin}
                            </div>
                          )}
                          {checkout && (
                            <div className="bg-white/15 border border-white/20 rounded-full px-3 py-2 text-xs backdrop-blur-md">
                              Check-out: {checkout}
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

                      <div className="mt-5 bg-surface-container-lowest rounded-3xl p-4">
                        <div className="text-xs uppercase tracking-[0.22em] text-outline mb-3">
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
                          <a
                            href={guestPageUrl}
                            target="_blank"
                            className="bg-gray-100 text-black rounded-2xl px-4 py-3 text-sm font-semibold text-center"
                          >
                            Open Page
                          </a>
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

                      <div className="mt-4 text-xs text-outline break-all">
                        {guestPageUrl || "Guest page URL not available yet."}
                      </div>
                    </div>
                  </div>
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
                placeholder="General apartment instructions"
                value={knowledgeBase.welcome_book.apartment_instructions}
                onChange={(e) =>
                  updateWelcomeBook("apartment_instructions", e.target.value)
                }
              />

              <TextArea
                placeholder="Kitchen instructions"
                value={knowledgeBase.welcome_book.kitchen}
                onChange={(e) =>
                  updateWelcomeBook("kitchen", e.target.value)
                }
              />

              <TextArea
                placeholder="Washing machine instructions"
                value={knowledgeBase.welcome_book.washing_machine}
                onChange={(e) =>
                  updateWelcomeBook("washing_machine", e.target.value)
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
                placeholder="Towels and linen instructions"
                value={knowledgeBase.welcome_book.towels_linen}
                onChange={(e) =>
                  updateWelcomeBook("towels_linen", e.target.value)
                }
              />

              <TextArea
                placeholder="Beach towels instructions"
                value={knowledgeBase.welcome_book.beach_towels}
                onChange={(e) =>
                  updateWelcomeBook("beach_towels", e.target.value)
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

        {activeTab === "extraservices" && (
          <Card variant="white" padding="p-7" border>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Settings size={24} /> Extra Services / Upselling
            </h2>

            <p className="text-outline mb-6 leading-relaxed">
              Optional guest-facing services, partner offers and upselling opportunities. Keep this disabled until you have real services to show.
            </p>

            <div className="mb-6 bg-surface-container-lowest rounded-3xl p-5 border border-outline/20">
              <div className="font-bold text-on-surface mb-2">
                Optional revenue module
              </div>
              <p className="text-sm text-outline leading-relaxed">
                Use this section for future upselling: scooter rental, car rental,
                airport transfers, tours, excursions, massages, private chef,
                breakfast baskets, late checkout, luggage storage, beach clubs,
                restaurant discounts or local partnerships.
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-[1fr_auto] gap-4 items-stretch">
                <div className="bg-surface-container-lowest rounded-2xl p-5">
                  <Toggle
                    label={
                      knowledgeBase.extra_services.enabled
                        ? "Extra Services enabled — guests can see this module when content is available."
                        : "Extra Services disabled — the module is saved but hidden from guests."
                    }
                    checked={knowledgeBase.extra_services.enabled}
                    onChange={(checked) =>
                      updateExtraServices("enabled", checked)
                    }
                  />
                </div>

                <Button variant="secondary" onClick={applyExtraServicesTemplate}>
                  Use Template
                </Button>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-1">
                  Section title
                </label>
                <p className="text-xs text-outline mb-2">
                  Guest-facing title shown on the guest page.
                </p>
                <Input
                  placeholder="Extra Services"
                  value={knowledgeBase.extra_services.title}
                  onChange={(event) =>
                    updateExtraServices("title", event.target.value)
                  }
                />
              </div>

              <TextArea
                placeholder="Guest intro — short intro shown to guests above the services list."
                value={knowledgeBase.extra_services.intro}
                onChange={(e) =>
                  updateExtraServices("intro", e.target.value)
                }
              />

              <TextArea
                placeholder="Services and offers — add one service per line. Example: Airport transfer — Contact host for availability and price."
                value={knowledgeBase.extra_services.services}
                onChange={(e) =>
                  updateExtraServices("services", e.target.value)
                }
                minHeight="min-h-[220px]"
              />

              <TextArea
                placeholder="Internal host note — add partner contacts, prices, commissions, availability rules and services that require manual host approval. This is not shown to guests."
                value={knowledgeBase.extra_services.host_note}
                onChange={(e) =>
                  updateExtraServices("host_note", e.target.value)
                }
              />
            </div>
          </Card>
        )}

        {activeTab === "localguide" && (
          <Card variant="white" padding="p-7" border>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <MapPinIcon size={24} /> Local Guide
            </h2>

            <p className="text-outline mb-6 leading-relaxed">
              Local recommendations and area information for guests: restaurants, bars, beaches, transport and things to do.
            </p>

            <div className="space-y-5">
              <TextArea
                placeholder="Neighbourhood overview — explain the area, atmosphere, nearby landmarks and what guests should know."
                value={knowledgeBase.local_guide.neighbourhood_overview}
                onChange={(e) =>
                  updateLocalGuide("neighbourhood_overview", e.target.value)
                }
              />

              <TextArea
                placeholder="Restaurants — add recommended places to eat nearby."
                value={knowledgeBase.local_guide.restaurants}
                onChange={(e) =>
                  updateLocalGuide("restaurants", e.target.value)
                }
              />

              <TextArea
                placeholder="Breakfast and coffee — add cafés, bakeries and breakfast spots."
                value={knowledgeBase.local_guide.breakfast_coffee}
                onChange={(e) =>
                  updateLocalGuide("breakfast_coffee", e.target.value)
                }
              />

              <TextArea
                placeholder="Bars — add cocktail bars, wine bars, pubs or nightlife recommendations."
                value={knowledgeBase.local_guide.bars}
                onChange={(e) =>
                  updateLocalGuide("bars", e.target.value)
                }
              />

              <TextArea
                placeholder="Beaches — add nearby beaches, swimming spots, rocky beaches and beach clubs."
                value={knowledgeBase.local_guide.beaches}
                onChange={(e) =>
                  updateLocalGuide("beaches", e.target.value)
                }
              />

              <TextArea
                placeholder="Things to visit — add attractions, sightseeing ideas, day trips and cultural places."
                value={knowledgeBase.local_guide.things_to_visit}
                onChange={(e) =>
                  updateLocalGuide("things_to_visit", e.target.value)
                }
              />

              <TextArea
                placeholder="Transport and getting around — add airport transfer, buses, ferries, Bolt/Uber, taxis and walking tips."
                value={knowledgeBase.local_guide.transport_getting_around}
                onChange={(e) =>
                  updateLocalGuide("transport_getting_around", e.target.value)
                }
              />

              <TextArea
                placeholder="Useful services — add supermarkets, pharmacies, clinics, ATMs, laundry, gyms or other practical services."
                value={knowledgeBase.local_guide.useful_services}
                onChange={(e) =>
                  updateLocalGuide("useful_services", e.target.value)
                }
              />

              <TextArea
                placeholder="Host recommendations — add your personal favourites and practical tips."
                value={knowledgeBase.local_guide.host_recommendations}
                onChange={(e) =>
                  updateLocalGuide("host_recommendations", e.target.value)
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
                placeholder="Complaint handling — explain how the AI should respond to complaints, unhappy guests or sensitive situations."
                value={knowledgeBase.ai_training.complaint_handling}
                onChange={(e) =>
                  updateAiTraining("complaint_handling", e.target.value)
                }
              />

              <TextArea
                placeholder="Escalation rules — explain when the AI should tell the guest to contact the host immediately."
                value={knowledgeBase.ai_training.escalation_rules}
                onChange={(e) =>
                  updateAiTraining("escalation_rules", e.target.value)
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
        disabled={!canSaveSelectedProperty}
        statusMessage={saveStatusMessage}
        onSave={save}
      />
    </div>
  );
}
