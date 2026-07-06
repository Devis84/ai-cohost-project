import { useMemo } from "react";
import { getPropertyIdentifier } from "../_lib/dashboard-utils";
import { usePropertyReadiness } from "./usePropertyReadiness";
import type { KnowledgeBase, Property } from "../_types/dashboard";
import type { PropertyReadiness } from "../_lib/property-readiness";

interface UseDashboardComputedParams {
  properties: Property[];
  selectedSlug: string;
  propertyName: string;
  city: string;
  country: string;
  address: string;
  wifiName?: string;
  wifiPassword?: string;
  checkin?: string;
  checkout?: string;
  checkinNotes?: string;
  emergencyNumbers?: string;
  lockboxCode?: string;
  knowledgeBase: KnowledgeBase;
  aiEnabled: boolean;
  welcomebookEnabled: boolean;
  saving: boolean;
  loadingSelectedProperty: boolean;
  isNewProperty: boolean;
  loadedPropertyIdentifier: string;
  dashboardAccessIsPartner: boolean;
  dashboardAccessRole: string;
  dashboardAccessCanCreateProperty: boolean;
  dashboardAccessCanDeleteProperty: boolean;
}

interface UseDashboardComputedReturn {
  selectedProperty: Property | undefined;
  guestPageUrl: string;
  isMalteseMaisonette: boolean;
  isPartnerMode: boolean;
  extraServices: KnowledgeBase["extra_services"];
  heroPreviewTitle: string;
  aboutPreviewDescription: string;
  commandGuestPageReady: boolean;
  commandWelcomeReady: boolean;
  commandAiReady: boolean;
  commandAccessReady: boolean;
  commandExtraServicesReady: boolean;
  commandLocationLabel: string;
  readiness: PropertyReadiness;
  loadingReadiness: boolean;
  canSaveSelectedProperty: boolean;
  saveStatusMessage: string;
}

export function useDashboardComputed(
  params: UseDashboardComputedParams
): UseDashboardComputedReturn {
  const {
    properties,
    selectedSlug,
    propertyName,
    city,
    country,
    address,
    wifiName = "",
    wifiPassword = "",
    checkin = "",
    checkout = "",
    checkinNotes = "",
    emergencyNumbers = "",
    lockboxCode = "",
    knowledgeBase,
    aiEnabled,
    welcomebookEnabled,
    saving,
    loadingSelectedProperty,
    isNewProperty,
    loadedPropertyIdentifier,
    dashboardAccessIsPartner,
    dashboardAccessRole,
    dashboardAccessCanCreateProperty,
    dashboardAccessCanDeleteProperty,
  } = params;

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
      dashboardAccessIsPartner ||
      dashboardAccessRole === "partner" ||
      !dashboardAccessCanCreateProperty ||
      !dashboardAccessCanDeleteProperty
    );
  }, [
    dashboardAccessIsPartner,
    dashboardAccessRole,
    dashboardAccessCanCreateProperty,
    dashboardAccessCanDeleteProperty,
  ]);

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

  const commandGuestPageReady = useMemo(
    () =>
      Boolean(
        guestPageUrl &&
          heroPreviewTitle.trim() &&
          aboutPreviewDescription.trim()
      ),
    [guestPageUrl, heroPreviewTitle, aboutPreviewDescription]
  );

  const commandWelcomeReady = useMemo(
    () =>
      Boolean(
        welcomebookEnabled &&
          (knowledgeBase.welcome_book.description.trim() ||
            knowledgeBase.welcome_book.house_rules.trim() ||
            knowledgeBase.welcome_book.checkout_notes.trim())
      ),
    [welcomebookEnabled, knowledgeBase.welcome_book]
  );

  const commandAiReady = useMemo(
    () =>
      Boolean(
        aiEnabled &&
          (knowledgeBase.ai_training.faq.trim() ||
            knowledgeBase.ai_training.troubleshooting.trim() ||
            knowledgeBase.ai_training.escalation_rules.trim())
      ),
    [aiEnabled, knowledgeBase.ai_training]
  );

  const commandAccessReady = useMemo(
    () =>
      Boolean(
        wifiName.trim() ||
          wifiPassword.trim() ||
          checkin.trim() ||
          checkout.trim() ||
          checkinNotes.trim()
      ),
    [wifiName, wifiPassword, checkin, checkout, checkinNotes]
  );

  const commandExtraServicesReady = useMemo(
    () =>
      Boolean(
        extraServices.enabled &&
          (extraServices.title.trim() ||
            extraServices.intro.trim() ||
            extraServices.services.trim())
      ),
    [extraServices]
  );

  const commandLocationLabel = useMemo(
    () =>
      [city, country]
        .filter(Boolean)
        .join(", "),
    [city, country]
  );

  const { readiness, loadingOperations: loadingReadiness } =
    usePropertyReadiness({
      selectedProperty,
      propertyName,
      city,
      country,
      address,
      wifiName,
      wifiPassword,
      checkin,
      checkout,
      checkinNotes,
      emergencyNumbers,
      lockboxCode,
      knowledgeBase,
      aiEnabled,
      welcomebookEnabled,
    });

  const canSaveSelectedProperty = useMemo(
    () =>
      Boolean(
        propertyName.trim() &&
          !saving &&
          !loadingSelectedProperty &&
          (!isNewProperty || dashboardAccessCanCreateProperty) &&
          (isNewProperty ||
            (selectedSlug &&
              loadedPropertyIdentifier &&
              loadedPropertyIdentifier === selectedSlug))
      ),
    [
      propertyName,
      saving,
      loadingSelectedProperty,
      isNewProperty,
      dashboardAccessCanCreateProperty,
      selectedSlug,
      loadedPropertyIdentifier,
    ]
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

    if (isNewProperty && !dashboardAccessCanCreateProperty) {
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
    dashboardAccessCanCreateProperty,
    selectedSlug,
    loadedPropertyIdentifier,
  ]);

  return {
    selectedProperty,
    guestPageUrl,
    isMalteseMaisonette,
    isPartnerMode,
    extraServices,
    heroPreviewTitle,
    aboutPreviewDescription,
    commandGuestPageReady,
    commandWelcomeReady,
    commandAiReady,
    commandAccessReady,
    commandExtraServicesReady,
    commandLocationLabel,
    readiness,
    loadingReadiness,
    canSaveSelectedProperty,
    saveStatusMessage,
  };
}
