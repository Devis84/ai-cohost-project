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
    wifiName,
    wifiPassword,
    checkin,
    checkout,
    checkinNotes,
    knowledgeBase,
    aiEnabled,
    welcomebookEnabled,
    saving,
    loadingSelectedProperty,
    isNewProperty,
    canCreateProperty: dashboardAccess.canCreateProperty,
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

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <DashboardHeader
        propertiesCount={properties.length}
        aiEnabled={aiEnabled}
        isPartnerMode={computed.isPartnerMode}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 pb-32">
        <DashboardCommandCenter
          propertyName={propertyName}
          propertiesCount={properties.length}
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
          extraServicesEnabled={computed.extraServices.enabled}
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
