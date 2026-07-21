 "use client";

import { useEffect, useState } from "react";

import { DashboardCommandCenter } from "./_components/DashboardCommandCenter";
import { DashboardGeneralTab } from "./_components/DashboardGeneralTab";
import { DashboardGuestPageTab } from "./_components/DashboardGuestPageTab";
import { DashboardHeader } from "./_components/DashboardHeader";
import { DashboardSaveBar } from "./_components/DashboardSaveBar";
import { DashboardSidebar } from "./_components/DashboardSidebar";

import { ExtraServicesSection } from "./_sections/ExtraServicesSection";
import { WelcomeBookSection } from "./_sections/WelcomeBookSection";
import { LocalGuideSection } from "./_sections/LocalGuideSection";
import { AiTrainingSection } from "./_sections/AiTrainingSection";
import {
  SmartSetupAssistantSection,
  type SetupAssistantDraft,
} from "./_sections/SmartSetupAssistantSection";

import { createSlug } from "./_lib/dashboard-utils";

import { useDashboardProperties } from "./_hooks/useDashboardProperties";
import { useDashboardFormState } from "./_hooks/useDashboardFormState";
import { useKnowledgeBaseActions } from "./_hooks/useKnowledgeBaseActions";
import { useDashboardTemplates } from "./_hooks/useDashboardTemplates";
import { useDashboardClipboard } from "./_hooks/useDashboardClipboard";
import { useDashboardComputed } from "./_hooks/useDashboardComputed";

import { buildPropertySavePayload } from "./_lib/dashboard-save-payload";
import { malteseMaisonetteHeroImage } from "./_constants/dashboardConstants";

import type { Property } from "./_types/dashboard";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);

  const {
    propertyName,
    setPropertyName,
    newProperty,
    setNewProperty,
    isNewProperty,
    setIsNewProperty,
    city,
    setCity,
    country,
    setCountry,
    address,
    setAddress,
    wifiName,
    setWifiName,
    wifiPassword,
    setWifiPassword,
    checkin,
    setCheckin,
    checkout,
    setCheckout,
    checkinNotes,
    setCheckinNotes,
    lockboxCode,
    setLockboxCode,
    emergencyNumbers,
    setEmergencyNumbers,
    knowledgeBase,
    setKnowledgeBase,
    aiEnabled,
    setAiEnabled,
    whatsappEnabled,
    setWhatsappEnabled,
    telegramEnabled,
    setTelegramEnabled,
    welcomebookEnabled,
    setWelcomebookEnabled,
    fillForm,
    resetForm,
  } = useDashboardFormState();

  const {
    properties,
    selectedSlug,
    loadedPropertyIdentifier,
    loadingSelectedProperty,
    loadingProperties,
    dashboardAccess,
    loadProperties,
    loadPropertyData,
    selectProperty,
    setLoadedPropertyIdentifier,
  } = useDashboardProperties({
    fillForm,
    resetForm,
  });

  const {
    updateGuestPage,
    updateGuestSupport,
    updateWelcomeBook,
    updateExtraServices,
    updateLocalGuide,
    updateAiTraining,
  } = useKnowledgeBaseActions({
    setKnowledgeBase,
  });

  const computed = useDashboardComputed({
    properties,
    selectedSlug,
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
    saving,
    loadingSelectedProperty,
    isNewProperty,
    loadedPropertyIdentifier,
    dashboardAccessIsPartner: dashboardAccess.isPartner,
    dashboardAccessRole: dashboardAccess.role,
    dashboardAccessCanCreateProperty:
      dashboardAccess.canCreateProperty,
    dashboardAccessCanDeleteProperty:
      dashboardAccess.canDeleteProperty,
  });

  const {
    applyDefaultHeroImage,
    applyPremiumGuestCopy,
    applyMalteseMaisonetteGuestCopy,
    applyExtraServicesTemplate,
  } = useDashboardTemplates({
    propertyName,
    city,
    isMalteseMaisonette: computed.isMalteseMaisonette,
    updateGuestPage,
    setKnowledgeBase,
  });

  const { copyWifi, copyGuestUrl } = useDashboardClipboard({
    wifiName,
    wifiPassword,
    guestPageUrl: computed.guestPageUrl,
  });

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    if (!selectedSlug || isNewProperty) {
      return;
    }

    loadPropertyData(selectedSlug);
  }, [selectedSlug, isNewProperty]);

  function handleSelectProperty(propertyIdentifier: string) {
    if (!propertyIdentifier) {
      return;
    }

    setIsNewProperty(false);
    selectProperty(propertyIdentifier);
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
      alert(
        "Please wait until the selected property has finished loading."
      );
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

    const payload = buildPropertySavePayload({
      propertyName,
      city,
      country,
      address,
      wifiName,
      wifiPassword,
      checkin,
      checkout,
      checkinNotes,
      lockboxCode,
      emergencyNumbers,
      knowledgeBase,
      aiEnabled,
      whatsappEnabled,
      telegramEnabled,
      welcomebookEnabled,
      selectedSlug,
      selectedProperty: computed.selectedProperty,
    });

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
        savedProperty.slug || savedProperty.id || payload.slug;

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

  function applyAutofillDraft(draft: SetupAssistantDraft) {
    const clean = (value: string) => value.trim();

    const fromDraft = (value: string, current: string) => {
      const next = clean(value);
      return next ? next : current;
    };

    setKnowledgeBase((current) => ({
      ...current,
      guest_page: {
        ...current.guest_page,
        hero_title: fromDraft(
          draft.guest_page.hero_title,
          current.guest_page.hero_title
        ),
        hero_intro: fromDraft(
          draft.guest_page.hero_intro,
          current.guest_page.hero_intro
        ),
        about_description: fromDraft(
          draft.guest_page.about_description,
          current.guest_page.about_description
        ),
        about_highlights: fromDraft(
          draft.property_highlights ||
            draft.guest_page.about_highlights,
          current.guest_page.about_highlights
        ),
      },
      welcome_book: {
        ...current.welcome_book,
        description: fromDraft(
          draft.welcome_book.description,
          current.welcome_book.description
        ),
        amenities: fromDraft(
          draft.welcome_book.amenities,
          current.welcome_book.amenities
        ),
        house_rules: fromDraft(
          draft.house_rules ||
            draft.welcome_book.house_rules,
          current.welcome_book.house_rules
        ),
        apartment_instructions: fromDraft(
          draft.welcome_book.apartment_instructions,
          current.welcome_book.apartment_instructions
        ),
        checkout_notes: fromDraft(
          draft.welcome_book.checkout_notes,
          current.welcome_book.checkout_notes
        ),
        parking: fromDraft(
          draft.parking_notes ||
            draft.welcome_book.parking,
          current.welcome_book.parking
        ),
        extra_notes: fromDraft(
          draft.welcome_book.extra_notes,
          current.welcome_book.extra_notes
        ),
        restaurants: fromDraft(
          draft.welcome_book.restaurants,
          current.welcome_book.restaurants
        ),
        transport: fromDraft(
          draft.welcome_book.transport,
          current.welcome_book.transport
        ),
        local_guide: fromDraft(
          draft.welcome_book.local_guide,
          current.welcome_book.local_guide
        ),
      },
      local_guide: {
        ...current.local_guide,
        neighbourhood_overview: fromDraft(
          draft.local_guide.neighbourhood_overview,
          current.local_guide.neighbourhood_overview
        ),
        restaurants: fromDraft(
          draft.local_guide.restaurants,
          current.local_guide.restaurants
        ),
        things_to_visit: fromDraft(
          draft.local_guide.things_to_visit,
          current.local_guide.things_to_visit
        ),
        transport_getting_around: fromDraft(
          draft.local_guide.transport_getting_around,
          current.local_guide.transport_getting_around
        ),
        host_recommendations: fromDraft(
          draft.local_guide.host_recommendations,
          current.local_guide.host_recommendations
        ),
      },
      ai_training: {
        ...current.ai_training,
        faq: fromDraft(
          draft.ai_training.faq,
          current.ai_training.faq
        ),
        troubleshooting: fromDraft(
          draft.ai_training.troubleshooting,
          current.ai_training.troubleshooting
        ),
        guest_style: fromDraft(
          draft.ai_training.guest_style,
          current.ai_training.guest_style
        ),
        escalation_rules: fromDraft(
          draft.ai_training.escalation_rules,
          current.ai_training.escalation_rules
        ),
      },
      extra_services: {
        ...current.extra_services,
        enabled:
          draft.extra_services.enabled ||
          current.extra_services.enabled,
        title: fromDraft(
          draft.extra_services.title,
          current.extra_services.title
        ),
        intro: fromDraft(
          draft.extra_services.intro,
          current.extra_services.intro
        ),
        services: fromDraft(
          draft.extra_services.services,
          current.extra_services.services
        ),
        host_note: fromDraft(
          draft.extra_services.host_note,
          current.extra_services.host_note
        ),
      },
    }));

    setCheckinNotes(
      fromDraft(
        draft.checkin_notes ||
          draft.welcome_book.apartment_instructions,
        checkinNotes
      )
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <DashboardHeader
        propertyName={propertyName}
        commandLocationLabel={computed.commandLocationLabel}
        aiEnabled={aiEnabled}
        isPartnerMode={computed.isPartnerMode}
        readiness={computed.readiness}
        properties={properties}
        selectedSlug={selectedSlug}
        loadingProperties={loadingProperties}
        loadingSelectedProperty={loadingSelectedProperty}
        onSelectProperty={handleSelectProperty}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 pb-32">
        <DashboardCommandCenter
          propertyName={propertyName}
          aiEnabled={aiEnabled}
          commandLocationLabel={computed.commandLocationLabel}
          guestPageUrl={computed.guestPageUrl}
          loadingSelectedProperty={loadingSelectedProperty}
          commandGuestPageReady={computed.commandGuestPageReady}
          commandWelcomeReady={computed.commandWelcomeReady}
          commandAiReady={computed.commandAiReady}
          commandAccessReady={computed.commandAccessReady}
          commandExtraServicesReady={
            computed.commandExtraServicesReady
          }
          readiness={computed.readiness}
          loadingReadiness={computed.loadingReadiness}
          extraServicesEnabled={computed.extraServices.enabled}
          wifiName={wifiName}
          wifiPassword={wifiPassword}
          onCopyWifi={copyWifi}
          onCopyGuestUrl={copyGuestUrl}
          onOpenTab={setActiveTab}
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
                guestPageUrl={computed.guestPageUrl}
                knowledgeBase={knowledgeBase}
                isMalteseMaisonette={
                  computed.isMalteseMaisonette
                }
                malteseMaisonetteHeroImage={
                  malteseMaisonetteHeroImage
                }
                onCopyGuestUrl={copyGuestUrl}
                onApplyDefaultHeroImage={
                  applyDefaultHeroImage
                }
                onApplyPremiumGuestCopy={
                  applyPremiumGuestCopy
                }
                onApplyMalteseMaisonetteGuestCopy={
                  applyMalteseMaisonetteGuestCopy
                }
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
                canCreateProperty={
                  dashboardAccess.canCreateProperty
                }
                canDeleteProperty={
                  dashboardAccess.canDeleteProperty
                }
                accessRole={dashboardAccess.role}
                onSelectProperty={handleSelectProperty}
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
                onSetWelcomebookEnabled={
                  setWelcomebookEnabled
                }
                onUpdateGuestSupport={updateGuestSupport}
                onUpdateWelcomeBook={updateWelcomeBook}
                onUpdateLocalGuide={updateLocalGuide}
                onUpdateExtraServices={updateExtraServices}
              />
            )}

            {activeTab === "extraservices" && (
              <ExtraServicesSection
                knowledgeBase={knowledgeBase}
                onUpdateExtraServices={updateExtraServices}
                onApplyTemplate={applyExtraServicesTemplate}
              />
            )}

            {activeTab === "welcomebook" && (
              <WelcomeBookSection
                knowledgeBase={knowledgeBase}
                onUpdateWelcomeBook={updateWelcomeBook}
              />
            )}

            {activeTab === "localguide" && (
              <LocalGuideSection
                knowledgeBase={knowledgeBase}
                onUpdateLocalGuide={updateLocalGuide}
              />
            )}

            {activeTab === "ai" && (
              <AiTrainingSection
                knowledgeBase={knowledgeBase}
                onUpdateAiTraining={updateAiTraining}
              />
            )}

            {activeTab === "smartsetup" && (
              <SmartSetupAssistantSection
                propertyName={propertyName}
                city={city}
                country={country}
                checkinNotes={checkinNotes}
                knowledgeBase={knowledgeBase}
                onApplyDraft={applyAutofillDraft}
              />
            )}
          </div>
        </div>
      </div>

      <DashboardSaveBar
        propertyName={propertyName}
        saveStatusMessage={computed.saveStatusMessage}
        saving={saving}
        canSave={computed.canSaveSelectedProperty}
        onSave={save}
      />
    </div>
  );
}