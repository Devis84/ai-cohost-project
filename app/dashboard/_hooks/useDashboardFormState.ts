 import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  createEmptyKnowledgeBase,
  mergeKnowledgeBase,
} from "../_lib/dashboard-utils";

import type {
  KnowledgeBase,
  Property,
} from "../_types/dashboard";

type FormSnapshot = {
  propertyName: string;
  city: string;
  country: string;
  address: string;
  wifiName: string;
  wifiPassword: string;
  checkin: string;
  checkout: string;
  checkinNotes: string;
  lockboxCode: string;
  emergencyNumbers: string;
  knowledgeBase: KnowledgeBase;
  aiEnabled: boolean;
  whatsappEnabled: boolean;
  telegramEnabled: boolean;
  welcomebookEnabled: boolean;
};

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

  isDirty: boolean;

  fillForm: (property: Property) => void;
  resetForm: (name?: string) => void;
  markFormClean: (property?: Property) => void;
}

function normalizeSnapshot(snapshot: FormSnapshot) {
  return {
    ...snapshot,
    propertyName: snapshot.propertyName.trim(),
    city: snapshot.city.trim(),
    country: snapshot.country.trim(),
    address: snapshot.address.trim(),
    wifiName: snapshot.wifiName.trim(),
    wifiPassword: snapshot.wifiPassword.trim(),
    checkin: snapshot.checkin.trim(),
    checkout: snapshot.checkout.trim(),
    checkinNotes: snapshot.checkinNotes.trim(),
    lockboxCode: snapshot.lockboxCode.trim(),
    emergencyNumbers: snapshot.emergencyNumbers.trim(),
  };
}

function serializeSnapshot(snapshot: FormSnapshot) {
  return JSON.stringify(normalizeSnapshot(snapshot));
}

function createSnapshotFromProperty(
  property: Property
): FormSnapshot {
  return {
    propertyName: property.property_name || "",
    city: property.city || "",
    country: property.country || "",
    address: property.address || "",
    wifiName: property.wifi_name || "",
    wifiPassword: property.wifi_password || "",
    checkin: property.checkin_time || "",
    checkout: property.checkout_time || "",
    checkinNotes:
      property.checkin_instructions || "",
    lockboxCode: property.lockbox_code || "",
    emergencyNumbers:
      property.emergency_numbers || "",
    knowledgeBase: mergeKnowledgeBase(property),
    aiEnabled: property.ai_enabled ?? true,
    whatsappEnabled:
      property.whatsapp_enabled ?? false,
    telegramEnabled:
      property.telegram_enabled ?? false,
    welcomebookEnabled:
      property.welcomebook_enabled ?? true,
  };
}

function createEmptySnapshot(
  propertyName = ""
): FormSnapshot {
  return {
    propertyName,
    city: "",
    country: "",
    address: "",
    wifiName: "",
    wifiPassword: "",
    checkin: "",
    checkout: "",
    checkinNotes: "",
    lockboxCode: "",
    emergencyNumbers: "",
    knowledgeBase: createEmptyKnowledgeBase(),
    aiEnabled: true,
    whatsappEnabled: false,
    telegramEnabled: false,
    welcomebookEnabled: true,
  };
}

export function useDashboardFormState(): UseDashboardFormStateReturn {
  const [propertyName, setPropertyName] =
    useState("");

  const [newProperty, setNewProperty] =
    useState("");

  const [isNewProperty, setIsNewProperty] =
    useState(false);

  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");

  const [wifiName, setWifiName] =
    useState("");

  const [wifiPassword, setWifiPassword] =
    useState("");

  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] =
    useState("");

  const [checkinNotes, setCheckinNotes] =
    useState("");

  const [lockboxCode, setLockboxCode] =
    useState("");

  const [
    emergencyNumbers,
    setEmergencyNumbers,
  ] = useState("");

  const [knowledgeBase, setKnowledgeBase] =
    useState<KnowledgeBase>(
      createEmptyKnowledgeBase
    );

  const [aiEnabled, setAiEnabled] =
    useState(true);

  const [
    whatsappEnabled,
    setWhatsappEnabled,
  ] = useState(false);

  const [
    telegramEnabled,
    setTelegramEnabled,
  ] = useState(false);

  const [
    welcomebookEnabled,
    setWelcomebookEnabled,
  ] = useState(true);

  const [
    baselineSignature,
    setBaselineSignature,
  ] = useState(() =>
    serializeSnapshot(createEmptySnapshot())
  );

  const currentSnapshot = useMemo<FormSnapshot>(
    () => ({
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
    }),
    [
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
    ]
  );

  const currentSignature = useMemo(
    () => serializeSnapshot(currentSnapshot),
    [currentSnapshot]
  );

  const isDirty =
    currentSignature !== baselineSignature;

  const applySnapshot = useCallback(
    (snapshot: FormSnapshot) => {
      setPropertyName(snapshot.propertyName);
      setCity(snapshot.city);
      setCountry(snapshot.country);
      setAddress(snapshot.address);

      setWifiName(snapshot.wifiName);
      setWifiPassword(snapshot.wifiPassword);

      setCheckin(snapshot.checkin);
      setCheckout(snapshot.checkout);
      setCheckinNotes(snapshot.checkinNotes);

      setLockboxCode(snapshot.lockboxCode);

      setEmergencyNumbers(
        snapshot.emergencyNumbers
      );

      setKnowledgeBase(snapshot.knowledgeBase);

      setAiEnabled(snapshot.aiEnabled);

      setWhatsappEnabled(
        snapshot.whatsappEnabled
      );

      setTelegramEnabled(
        snapshot.telegramEnabled
      );

      setWelcomebookEnabled(
        snapshot.welcomebookEnabled
      );
    },
    []
  );

  const fillForm = useCallback(
    (property: Property) => {
      const snapshot =
        createSnapshotFromProperty(property);

      applySnapshot(snapshot);

      setBaselineSignature(
        serializeSnapshot(snapshot)
      );
    },
    [applySnapshot]
  );

  const resetForm = useCallback(
    (name = "") => {
      const snapshot =
        createEmptySnapshot(name);

      applySnapshot(snapshot);

      if (name) {
        setBaselineSignature(
          serializeSnapshot(
            createEmptySnapshot("")
          )
        );
      } else {
        setBaselineSignature(
          serializeSnapshot(snapshot)
        );
      }
    },
    [applySnapshot]
  );

  const markFormClean = useCallback(
    (property?: Property) => {
      if (property) {
        const snapshot =
          createSnapshotFromProperty(property);

        applySnapshot(snapshot);

        setBaselineSignature(
          serializeSnapshot(snapshot)
        );

        return;
      }

      setBaselineSignature(currentSignature);
    },
    [
      applySnapshot,
      currentSignature,
    ]
  );

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

    isDirty,

    fillForm,
    resetForm,
    markFormClean,
  };
}