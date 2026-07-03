import { useCallback, useState } from "react";
import {
  createEmptyKnowledgeBase,
  mergeKnowledgeBase,
} from "../_lib/dashboard-utils";
import type { KnowledgeBase, Property } from "../_types/dashboard";

interface UseDashboardFormStateReturn {
  propertyName: string;
  setPropertyName: (value: string) => void;
  newProperty: string;
  setNewProperty: (value: string) => void;
  isNewProperty: boolean;
  setIsNewProperty: (value: boolean) => void;
  city: string;
  setCity: (value: string) => void;
  country: string;
  setCountry: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  wifiName: string;
  setWifiName: (value: string) => void;
  wifiPassword: string;
  setWifiPassword: (value: string) => void;
  checkin: string;
  setCheckin: (value: string) => void;
  checkout: string;
  setCheckout: (value: string) => void;
  checkinNotes: string;
  setCheckinNotes: (value: string) => void;
  lockboxCode: string;
  setLockboxCode: (value: string) => void;
  emergencyNumbers: string;
  setEmergencyNumbers: (value: string) => void;
  knowledgeBase: KnowledgeBase;
  setKnowledgeBase: (
    updater:
      | KnowledgeBase
      | ((current: KnowledgeBase) => KnowledgeBase)
  ) => void;
  aiEnabled: boolean;
  setAiEnabled: (value: boolean) => void;
  whatsappEnabled: boolean;
  setWhatsappEnabled: (value: boolean) => void;
  telegramEnabled: boolean;
  setTelegramEnabled: (value: boolean) => void;
  welcomebookEnabled: boolean;
  setWelcomebookEnabled: (value: boolean) => void;
  fillForm: (property: Property) => void;
  resetForm: (name?: string) => void;
}

export function useDashboardFormState(): UseDashboardFormStateReturn {
  const [propertyName, setPropertyName] = useState("");
  const [newProperty, setNewProperty] = useState("");
  const [isNewProperty, setIsNewProperty] = useState(false);
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

  const fillForm = useCallback(
    (property: Property) => {
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
    },
    []
  );

  const resetForm = useCallback((name = "") => {
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
  }, []);

  return {
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
  };
}
