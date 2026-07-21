/**
 * Italian Compliance Service
 * Handles compliance data management, calculations, and state for Italian properties
 * This is a structural module only - no external integrations yet
 */

export type ItalianComplianceData = {
  enabled: boolean;
  property_registration?: {
    cin?: string;
    regional_code?: string;
    local_commune?: string;
    scia_status?: "pending" | "submitted" | "approved" | "none";
    scia_submission_date?: string;
    notes?: string;
  };
  guest_identity?: {
    collection_status?: "pending" | "collected" | "verified" | "none";
    alloggiati_web_status?: "pending" | "submitted" | "confirmed" | "none";
    submission_deadline?: string;
    last_submitted_at?: string;
    notes?: string;
  };
  tourist_tax?: {
    municipality?: string;
    rate_notes?: string;
    guest_exemption_notes?: string;
    collection_status?: "pending" | "collected" | "none";
    reporting_status?: "pending" | "reported" | "none";
    notes?: string;
  };
  istat_regional?: {
    portal_name?: string;
    reporting_status?: "pending" | "reported" | "none";
    monthly_status?: string;
    notes?: string;
  };
  safety_checklist?: {
    smoke_detector?: boolean;
    carbon_monoxide_detector?: boolean;
    gas_detector?: boolean;
    fire_extinguisher?: boolean;
    emergency_numbers_posted?: boolean;
    safety_notes?: string;
  };
  document_archive?: {
    cin_certificate_available?: boolean;
    property_documents_available?: boolean;
    guest_documents_available?: boolean;
    tax_receipts_available?: boolean;
    notes?: string;
  };
  compliance_status?: {
    completed_items?: number;
    total_items?: number;
    compliance_score?: number;
    next_deadline?: string;
    last_updated?: string;
  };
};

/**
 * Calculate compliance score based on filled/required fields
 */
export function calculateComplianceScore(data: ItalianComplianceData): number {
  if (!data.enabled) return 0;

  let completed = 0;
  let total = 0;

  // Property Registration Section (4 items)
  total += 4;
  if (data.property_registration?.cin) completed++;
  if (data.property_registration?.regional_code) completed++;
  if (data.property_registration?.local_commune) completed++;
  if (data.property_registration?.scia_status && data.property_registration.scia_status !== "none")
    completed++;

  // Guest Identity Section (3 items)
  total += 3;
  if (
    data.guest_identity?.collection_status &&
    data.guest_identity.collection_status !== "none"
  )
    completed++;
  if (
    data.guest_identity?.alloggiati_web_status &&
    data.guest_identity.alloggiati_web_status !== "none"
  )
    completed++;
  if (data.guest_identity?.submission_deadline) completed++;

  // Tourist Tax Section (3 items)
  total += 3;
  if (data.tourist_tax?.municipality) completed++;
  if (
    data.tourist_tax?.collection_status &&
    data.tourist_tax.collection_status !== "none"
  )
    completed++;
  if (
    data.tourist_tax?.reporting_status &&
    data.tourist_tax.reporting_status !== "none"
  )
    completed++;

  // ISTAT & Regional Statistics (2 items)
  total += 2;
  if (data.istat_regional?.portal_name) completed++;
  if (
    data.istat_regional?.reporting_status &&
    data.istat_regional.reporting_status !== "none"
  )
    completed++;

  // Safety Checklist (5 items)
  total += 5;
  if (data.safety_checklist?.smoke_detector) completed++;
  if (data.safety_checklist?.carbon_monoxide_detector) completed++;
  if (data.safety_checklist?.gas_detector) completed++;
  if (data.safety_checklist?.fire_extinguisher) completed++;
  if (data.safety_checklist?.emergency_numbers_posted) completed++;

  // Document Archive (4 items)
  total += 4;
  if (data.document_archive?.cin_certificate_available) completed++;
  if (data.document_archive?.property_documents_available) completed++;
  if (data.document_archive?.guest_documents_available) completed++;
  if (data.document_archive?.tax_receipts_available) completed++;

  // Update compliance status
  if (!data.compliance_status) {
    data.compliance_status = {};
  }
  data.compliance_status.completed_items = completed;
  data.compliance_status.total_items = total;
  data.compliance_status.compliance_score = Math.round((completed / total) * 100);
  data.compliance_status.last_updated = new Date().toISOString();

  return data.compliance_status.compliance_score || 0;
}

/**
 * Check if property is in Italy
 */
export function isItalianProperty(country?: string | null): boolean {
  if (!country) return false;
  return (
    country.toLowerCase().includes("italy") ||
    country.toLowerCase().includes("italia")
  );
}

/**
 * Get compliance status color indicator
 */
export function getComplianceStatusColor(
  score: number
): "emerald" | "yellow" | "orange" | "red" {
  if (score >= 80) return "emerald";
  if (score >= 60) return "yellow";
  if (score >= 40) return "orange";
  return "red";
}

/**
 * Get list of compliance items that need attention
 */
export function getMissingComplianceItems(
  data: ItalianComplianceData
): string[] {
  const missing: string[] = [];

  if (!data.property_registration?.cin) missing.push("CIN code");
  if (!data.property_registration?.regional_code) missing.push("Regional code");
  if (!data.property_registration?.local_commune) missing.push("Comune registration");
  if (
    !data.property_registration?.scia_status ||
    data.property_registration.scia_status === "none"
  )
    missing.push("SCIA status");

  if (
    !data.guest_identity?.collection_status ||
    data.guest_identity.collection_status === "none"
  )
    missing.push("Guest document collection");
  if (
    !data.guest_identity?.alloggiati_web_status ||
    data.guest_identity.alloggiati_web_status === "none"
  )
    missing.push("Alloggiati Web submission");

  if (!data.tourist_tax?.municipality) missing.push("Tourist tax municipality");
  if (
    !data.tourist_tax?.collection_status ||
    data.tourist_tax.collection_status === "none"
  )
    missing.push("Tourist tax collection status");

  if (!data.istat_regional?.portal_name) missing.push("ISTAT portal name");
  if (
    !data.istat_regional?.reporting_status ||
    data.istat_regional.reporting_status === "none"
  )
    missing.push("ISTAT reporting status");

  if (!data.safety_checklist?.smoke_detector) missing.push("Smoke detector");
  if (!data.safety_checklist?.carbon_monoxide_detector)
    missing.push("CO detector");
  if (!data.safety_checklist?.gas_detector) missing.push("Gas detector");
  if (!data.safety_checklist?.fire_extinguisher) missing.push("Fire extinguisher");
  if (!data.safety_checklist?.emergency_numbers_posted)
    missing.push("Emergency numbers posted");

  if (!data.document_archive?.cin_certificate_available)
    missing.push("CIN certificate");
  if (!data.document_archive?.property_documents_available)
    missing.push("Property documents");
  if (!data.document_archive?.guest_documents_available)
    missing.push("Guest documents");
  if (!data.document_archive?.tax_receipts_available) missing.push("Tax receipts");

  return missing;
}

/**
 * Create default Italian compliance data structure for a new property
 */
export function createDefaultComplianceData(): ItalianComplianceData {
  return {
    enabled: false,
    property_registration: {
      cin: undefined,
      regional_code: undefined,
      local_commune: undefined,
      scia_status: "none",
      notes: undefined,
    },
    guest_identity: {
      collection_status: "none",
      alloggiati_web_status: "none",
      notes: undefined,
    },
    tourist_tax: {
      municipality: undefined,
      rate_notes: undefined,
      guest_exemption_notes: undefined,
      collection_status: "none",
      reporting_status: "none",
      notes: undefined,
    },
    istat_regional: {
      portal_name: undefined,
      reporting_status: "none",
      monthly_status: undefined,
      notes: undefined,
    },
    safety_checklist: {
      smoke_detector: false,
      carbon_monoxide_detector: false,
      gas_detector: false,
      fire_extinguisher: false,
      emergency_numbers_posted: false,
      safety_notes: undefined,
    },
    document_archive: {
      cin_certificate_available: false,
      property_documents_available: false,
      guest_documents_available: false,
      tax_receipts_available: false,
      notes: undefined,
    },
    compliance_status: {
      completed_items: 0,
      total_items: 21,
      compliance_score: 0,
      last_updated: new Date().toISOString(),
    },
  };
}

/**
 * Validate Italian compliance data
 */
export function validateComplianceData(
  data: Partial<ItalianComplianceData>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.enabled) {
    return { isValid: true, errors: [] };
  }

  // Validate required fields when enabled
  if (
    !data.property_registration?.cin ||
    data.property_registration.cin.trim() === ""
  ) {
    errors.push("CIN code is required");
  }

  if (
    !data.property_registration?.local_commune ||
    data.property_registration.local_commune.trim() === ""
  ) {
    errors.push("Municipality/Comune is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
