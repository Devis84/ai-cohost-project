import { useRef, useState } from "react";
import { getPropertyIdentifier } from "../_lib/dashboard-utils";
import type { DashboardAccess, Property } from "../_types/dashboard";

interface UseDashboardPropertiesParams {
  fillForm: (property: Property) => void;
  resetForm: (name?: string) => void;
}

interface UseDashboardPropertiesReturn {
  properties: Property[];
  selectedSlug: string;
  loadedPropertyIdentifier: string;
  loadingSelectedProperty: boolean;
  loadingProperties: boolean;
  dashboardAccess: DashboardAccess;
  loadProperties: () => Promise<void>;
  loadPropertyData: (identifier: string) => Promise<void>;
  selectProperty: (value: string) => void;
  rememberSelectedProperty: (value: string) => void;
  getRememberedPropertySlug: () => string;
  setProperties: (properties: Property[]) => void;
  setSelectedSlug: (slug: string) => void;
  setLoadedPropertyIdentifier: (identifier: string) => void;
  setLoadingSelectedProperty: (loading: boolean) => void;
  setLoadingProperties: (loading: boolean) => void;
  setDashboardAccess: (access: DashboardAccess) => void;
}

const selectedPropertyStorageKey =
  "ai_cohost_selected_property_slug";

export function useDashboardProperties(
  params: UseDashboardPropertiesParams
): UseDashboardPropertiesReturn {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [loadedPropertyIdentifier, setLoadedPropertyIdentifier] =
    useState("");
  const [loadingSelectedProperty, setLoadingSelectedProperty] =
    useState(false);
  const [loadingProperties, setLoadingProperties] =
    useState(true);
  const [dashboardAccess, setDashboardAccess] =
    useState<DashboardAccess>({
      email: null,
      role: "admin",
      isAdmin: true,
      isPartner: false,
      isViewer: false,
      isActive: true,
      canCreateProperty: true,
      canDeleteProperty: true,
      reason: "frontend_default_admin",
    });

  const latestLoadRequestId = useRef(0);

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

      setDashboardAccess({
        email:
          typeof data.access?.email === "string"
            ? data.access.email
            : null,
        role:
          typeof data.access?.role === "string"
            ? data.access.role
            : "admin",
        isAdmin:
          typeof data.access?.isAdmin === "boolean"
            ? data.access.isAdmin
            : true,
        isPartner:
          typeof data.access?.isPartner === "boolean"
            ? data.access.isPartner
            : false,
        isViewer:
          typeof data.access?.isViewer === "boolean"
            ? data.access.isViewer
            : false,
        isActive:
          typeof data.access?.isActive === "boolean"
            ? data.access.isActive
            : true,
        canCreateProperty:
          typeof data.access?.canCreateProperty ===
          "boolean"
            ? data.access.canCreateProperty
            : true,
        canDeleteProperty:
          typeof data.access?.canDeleteProperty ===
          "boolean"
            ? data.access.canDeleteProperty
            : true,
        reason:
          typeof data.access?.reason === "string"
            ? data.access.reason
            : "",
      });

      const loadedProperties =
        (data.properties || []) as Property[];

      setProperties(loadedProperties);

      if (loadedProperties.length === 0) {
        selectProperty("");
        params.resetForm();
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

      params.fillForm(property);
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

  return {
    properties,
    selectedSlug,
    loadedPropertyIdentifier,
    loadingSelectedProperty,
    loadingProperties,
    dashboardAccess,
    loadProperties,
    loadPropertyData,
    selectProperty,
    rememberSelectedProperty,
    getRememberedPropertySlug,
    setProperties,
    setSelectedSlug,
    setLoadedPropertyIdentifier,
    setLoadingSelectedProperty,
    setLoadingProperties,
    setDashboardAccess,
  };
}
