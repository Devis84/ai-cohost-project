import { useEffect, useMemo, useState } from "react";
import { buildPropertyReadiness, type PropertyReadiness, type ReadinessOperationsSnapshot } from "../_lib/property-readiness";
import type { KnowledgeBase, Property } from "../_types/dashboard";

type DashboardBookingsResponse = {
  success?: boolean;
  bookings?: {
    upcomingBookings?: Array<{ propertyId?: string | null }>;
    activeStays?: Array<{ propertyId?: string | null }>;
    completedStays?: Array<{ propertyId?: string | null }>;
    cancelledBookings?: Array<{ propertyId?: string | null }>;
  };
};

type CleaningTasksResponse = {
  success?: boolean;
  tasks?: Array<{
    property_id?: string | null;
    property_name?: string | null;
  }>;
};

type DashboardAnalyticsResponse = {
  success?: boolean;
  metrics?: {
    propertyStats?: Array<{
      property_id?: string | null;
      messages?: number | null;
      conversations?: number | null;
    }>;
  };
};

const emptyOperations: ReadinessOperationsSnapshot = {
  bookingsConfigured: false,
  hasUpcomingOrActiveStays: false,
  cleaningConfigured: false,
  hasPropertyAnalytics: false,
};

const emptyReadiness: PropertyReadiness = {
  overallScore: 0,
  overallStatus: "Missing",
  categories: [],
  nextActions: [],
  signals: {
    propertySelected: false,
    propertyBasicsComplete: false,
    wifiConfigured: false,
    checkinConfigured: false,
    houseRulesConfigured: false,
    localGuideConfigured: false,
    draftContentAvailable: false,
    guestPagePreviewReady: false,
    aiConciergeReady: false,
    operationsConnected: false,
    italianProperty: false,
    italianComplianceEnabled: false,
  },
};

function hasPropertyId(
  entry: { propertyId?: string | null },
  propertyId?: string
) {
  if (!propertyId) {
    return false;
  }

  return entry.propertyId === propertyId;
}

export function usePropertyReadiness({
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
}: {
  selectedProperty?: Property;
  propertyName: string;
  city: string;
  country: string;
  address: string;
  wifiName: string;
  wifiPassword: string;
  checkin: string;
  checkout: string;
  checkinNotes: string;
  emergencyNumbers: string;
  lockboxCode: string;
  knowledgeBase: KnowledgeBase;
  aiEnabled: boolean;
  welcomebookEnabled: boolean;
}) {
  const [operations, setOperations] = useState<ReadinessOperationsSnapshot>(emptyOperations);
  const [loadingOperations, setLoadingOperations] = useState(false);

  useEffect(() => {
    const propertyId = selectedProperty?.id;

    if (!propertyId) {
      setOperations(emptyOperations);
      return;
    }

    let cancelled = false;

    async function loadOperationalSignals() {
      try {
        setLoadingOperations(true);

        const [bookingsResponse, cleaningResponse, analyticsResponse] = await Promise.all([
          fetch("/api/dashboard-bookings", { cache: "no-store" }),
          fetch("/api/cleaning-tasks", { cache: "no-store" }),
          fetch("/api/dashboard-analytics", { cache: "no-store" }),
        ]);

        const bookingsData = (await bookingsResponse.json()) as DashboardBookingsResponse;
        const cleaningData = (await cleaningResponse.json()) as CleaningTasksResponse;
        const analyticsData = (await analyticsResponse.json()) as DashboardAnalyticsResponse;

        if (cancelled) {
          return;
        }

        const upcoming = bookingsData.bookings?.upcomingBookings || [];
        const active = bookingsData.bookings?.activeStays || [];
        const completed = bookingsData.bookings?.completedStays || [];
        const cancelledBookings = bookingsData.bookings?.cancelledBookings || [];

        const propertyBookings = [...upcoming, ...active, ...completed, ...cancelledBookings].filter((entry) =>
          hasPropertyId(entry, propertyId)
        );

        const hasUpcomingOrActiveStays =
          upcoming.some((entry) => hasPropertyId(entry, propertyId)) ||
          active.some((entry) => hasPropertyId(entry, propertyId));

        const propertyCleaningTasks = (cleaningData.tasks || []).filter((task) => {
          return task.property_id === propertyId;
        });

        const propertyStat = (analyticsData.metrics?.propertyStats || []).find((stat) => {
          return stat.property_id === propertyId;
        });

        setOperations({
          bookingsConfigured: propertyBookings.length > 0,
          hasUpcomingOrActiveStays,
          cleaningConfigured: propertyCleaningTasks.length > 0,
          hasPropertyAnalytics: Boolean((propertyStat?.messages || 0) > 0 || (propertyStat?.conversations || 0) > 0),
        });
      } catch (error) {
        if (!cancelled) {
          console.error("LOAD PROPERTY READINESS OPERATIONS ERROR:", error);
          setOperations(emptyOperations);
        }
      } finally {
        if (!cancelled) {
          setLoadingOperations(false);
        }
      }
    }

    loadOperationalSignals();

    return () => {
      cancelled = true;
    };
  }, [selectedProperty?.id]);

  const readiness = useMemo(() => {
    if (!selectedProperty && !propertyName.trim()) {
      return emptyReadiness;
    }

    return buildPropertyReadiness({
      property: selectedProperty,
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
      operations,
    });
  }, [
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
    operations,
  ]);

  return {
    readiness,
    loadingOperations,
  };
}