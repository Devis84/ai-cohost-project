"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type ItalianComplianceData = {
  enabled: boolean;
  property_registration?: {
    cin?: string;
    regional_code?: string;
    local_commune?: string;
    scia_status?: string;
    scia_submission_date?: string;
    notes?: string;
  };
  guest_identity?: {
    collection_status?: string;
    alloggiati_web_status?: string;
    submission_deadline?: string;
    last_submitted_at?: string;
    notes?: string;
  };
  tourist_tax?: {
    municipality?: string;
    rate_notes?: string;
    guest_exemption_notes?: string;
    collection_status?: string;
    reporting_status?: string;
    notes?: string;
  };
  istat_regional?: {
    portal_name?: string;
    reporting_status?: string;
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

type Property = {
  id: string;
  property_name: string;
  country?: string | null;
  knowledge_base?: {
    italian_compliance?: ItalianComplianceData;
  };
};

function isItalianProperty(country?: string | null): boolean {
  if (!country) return false;
  return (
    country.toLowerCase().includes("italy") ||
    country.toLowerCase().includes("italia")
  );
}

export default function ItalyComplianceContent() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("propertyId");

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [complianceData, setComplianceData] = useState<ItalianComplianceData>({
    enabled: false,
  });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch("/api/properties");
        if (!response.ok) throw new Error("Failed to fetch properties");

        const data = await response.json();
        const allProperties = Array.isArray(data) ? data : data.properties || [];

        setProperties(allProperties);

        // If propertyId provided, select that property
        if (propertyId) {
          const prop = allProperties.find((p: Property) => p.id === propertyId);
          if (prop) {
            setSelectedProperty(prop);
            if (
              prop.knowledge_base?.italian_compliance &&
              prop.knowledge_base.italian_compliance.enabled
            ) {
              setComplianceData(prop.knowledge_base.italian_compliance);
            }
          }
        } else if (allProperties.length > 0) {
          // Auto-select first Italian property if available
          const italianProp = allProperties.find(
            (p: Property) =>
              isItalianProperty(p.country) ||
              (p.knowledge_base?.italian_compliance?.enabled === true)
          );
          if (italianProp) {
            setSelectedProperty(italianProp);
            if (
              italianProp.knowledge_base?.italian_compliance &&
              italianProp.knowledge_base.italian_compliance.enabled
            ) {
              setComplianceData(italianProp.knowledge_base.italian_compliance);
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load properties");
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [propertyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin">⏳</div>
        <span className="ml-2">Loading properties...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-[24px] p-6">
        <div className="text-red-700 font-semibold">Error: {error}</div>
      </div>
    );
  }

  // If no properties found at all
  if (properties.length === 0) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-black mb-2">
            🇮🇹 Italian Compliance
          </h1>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-[24px] p-6 sm:p-8">
          <div className="text-gray-600">No properties found</div>
        </div>
      </div>
    );
  }

  // If property selector needed
  if (!selectedProperty) {
    const italianProperties = properties.filter(
      (p) =>
        isItalianProperty(p.country) ||
        p.knowledge_base?.italian_compliance?.enabled === true
    );

    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-black mb-2">
            🇮🇹 Italian Compliance
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Select a property to view compliance status
          </p>
        </div>

        {italianProperties.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-[24px] p-6 sm:p-8">
            <h2 className="font-semibold text-lg text-amber-900 mb-2">No Italian Properties</h2>
            <p className="text-amber-800 text-sm">
              You don&apos;t have any properties configured as Italian locations yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {italianProperties.map((prop) => (
              <button
                key={prop.id}
                onClick={() => setSelectedProperty(prop)}
                className="text-left bg-white border border-gray-200 rounded-[20px] p-5 hover:shadow-lg transition hover:border-gray-400 active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-semibold text-black text-lg">
                    {prop.property_name}
                  </div>
                  <div className="text-2xl">🇮🇹</div>
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  {isItalianProperty(prop.country) ? "📍 Italian location" : ""}
                  {prop.knowledge_base?.italian_compliance?.enabled
                    ? " • ✓ Module enabled"
                    : " • Module available"}
                </div>
              </button>
            ))}
          </div>
        )}

        {properties.length > italianProperties.length && (
          <div className="mt-8">
            <h3 className="font-semibold text-black mb-3">All Properties</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {properties.map((prop) => (
                <button
                  key={prop.id}
                  onClick={() => setSelectedProperty(prop)}
                  className="text-left bg-gray-50 border border-gray-200 rounded-[20px] p-5 hover:shadow-lg transition hover:border-gray-400 active:scale-[0.98]"
                >
                  <div className="font-semibold text-black text-lg">
                    {prop.property_name}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    {prop.country ? `📍 ${prop.country}` : "📍 Location not set"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const property = selectedProperty;
  const isItaly = isItalianProperty(property.country);
  const isEnabled = complianceData.enabled;

  if (!isItaly && !isEnabled) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedProperty(null)}
          className="text-blue-600 hover:text-blue-700 text-sm font-semibold mb-4"
        >
          ← Back to Properties
        </button>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-black mb-2">
            🇮🇹 Italian Compliance
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {property?.property_name}
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-[24px] p-6 sm:p-8 shadow-md">
          <div className="flex gap-4">
            <div className="text-4xl">📍</div>
            <div>
              <h2 className="font-semibold text-lg text-amber-900 mb-2">
                Module Not Activated
              </h2>
              <p className="text-amber-800 mb-4">
                This property is not configured as an Italian location. The Italian Compliance module
                is only available for properties located in Italy.
              </p>
              <p className="text-xs sm:text-sm text-amber-700 italic">
                💡 To enable this module, update the property location to Italy in property settings.
              </p>
              <p className="text-xs sm:text-sm text-amber-700 italic mt-3">
                ⚖️ <strong>Disclaimer:</strong> This module is an operational checklist and does not
                replace legal or accounting advice. Consult with local professionals for compliance
                requirements.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedProperty(null)}
          className="text-blue-600 hover:text-blue-700 text-sm font-semibold mb-4"
        >
          ← Back to Properties
        </button>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-black mb-2">
            🇮🇹 Italian Compliance
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {property?.property_name}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-[24px] p-6 sm:p-8 shadow-md">
          <div className="flex gap-4">
            <div className="text-4xl">ℹ️</div>
            <div>
              <h2 className="font-semibold text-lg text-blue-900 mb-2">
                Module Disabled
              </h2>
              <p className="text-blue-800 mb-4">
                The Italian Compliance module is optional and currently disabled for{" "}
                <strong>{property?.property_name}</strong>. This module is designed to help Italian
                property owners track local compliance requirements.
              </p>
              <p className="text-xs sm:text-sm text-blue-700 italic mt-3">
                💡 You can enable this module by editing the property settings.
              </p>
              <p className="text-xs sm:text-sm text-blue-700 italic mt-3">
                ⚖️ <strong>Disclaimer:</strong> This module is an operational checklist and does not
                replace legal or accounting advice. Consult with local professionals for compliance
                requirements.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Module is enabled - render all 7 sections (full content...)
  const complianceScore = complianceData.compliance_status?.compliance_score || 0;
  const completedItems = complianceData.compliance_status?.completed_items || 0;
  const totalItems = complianceData.compliance_status?.total_items || 0;

  return (
    <div className="space-y-6">
      <button
        onClick={() => setSelectedProperty(null)}
        className="text-blue-600 hover:text-blue-700 text-sm font-semibold mb-4"
      >
        ← Back to Properties
      </button>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-black mb-2">
          🇮🇹 Italian Compliance
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          {property?.property_name} • Compliance Tracker
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-gray-600 italic">
          ⚖️ <strong>Disclaimer:</strong> This module is an operational checklist and does not replace
          legal or accounting advice. Consult with local professionals for compliance requirements.
        </p>
      </div>

      {/* Compliance Score Card */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-[24px] p-6 sm:p-8 shadow-lg">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-black mb-1">
              {Math.round(complianceScore)}%
            </div>
            <div className="text-xs sm:text-sm font-semibold opacity-90">Compliance Score</div>
          </div>
          <div className="text-center border-l border-r border-white/30">
            <div className="text-3xl sm:text-4xl font-black mb-1">{completedItems}</div>
            <div className="text-xs sm:text-sm font-semibold opacity-90">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-black mb-1">{totalItems}</div>
            <div className="text-xs sm:text-sm font-semibold opacity-90">Total Items</div>
          </div>
        </div>
        {complianceData.compliance_status?.next_deadline && (
          <div className="mt-4 pt-4 border-t border-white/30">
            <div className="text-xs sm:text-sm font-semibold">
              📅 Next Deadline:{" "}
              {new Date(complianceData.compliance_status.next_deadline).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {/* Section 1: Property Registration */}
      <div className="bg-white border border-gray-200 rounded-[24px] p-6 sm:p-8 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🏢</span>
          <h2 className="text-xl sm:text-2xl font-black text-black">Property Registration</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 mb-1">CIN Code</div>
            <div className="font-semibold text-black">
              {complianceData.property_registration?.cin || "—"}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 mb-1">Regional Code</div>
            <div className="font-semibold text-black">
              {complianceData.property_registration?.regional_code || "—"}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 mb-1">Comune / Municipality</div>
            <div className="font-semibold text-black">
              {complianceData.property_registration?.local_commune || "—"}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 mb-1">SCIA Status</div>
            <div className="font-semibold text-black">
              {complianceData.property_registration?.scia_status || "—"}
            </div>
          </div>
        </div>
        {complianceData.property_registration?.notes && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-xs font-semibold text-blue-900 mb-1">Notes</div>
            <div className="text-sm text-blue-800">
              {complianceData.property_registration.notes}
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Guest Identity & Questura */}
      <div className="bg-white border border-gray-200 rounded-[24px] p-6 sm:p-8 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📋</span>
          <h2 className="text-xl sm:text-2xl font-black text-black">Guest Identity & Questura</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 mb-1">Document Collection</div>
            <div className="font-semibold text-black">
              {complianceData.guest_identity?.collection_status || "—"}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 mb-1">Alloggiati Web Status</div>
            <div className="font-semibold text-black">
              {complianceData.guest_identity?.alloggiati_web_status || "—"}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 mb-1">Submission Deadline</div>
            <div className="font-semibold text-black">
              {complianceData.guest_identity?.submission_deadline
                ? new Date(complianceData.guest_identity.submission_deadline).toLocaleDateString()
                : "—"}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 mb-1">Last Submitted</div>
            <div className="font-semibold text-black">
              {complianceData.guest_identity?.last_submitted_at
                ? new Date(complianceData.guest_identity.last_submitted_at).toLocaleDateString()
                : "—"}
            </div>
          </div>
        </div>
        {complianceData.guest_identity?.notes && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-xs font-semibold text-blue-900 mb-1">Notes</div>
            <div className="text-sm text-blue-800">{complianceData.guest_identity.notes}</div>
          </div>
        )}
      </div>

      {/* Section 3: Tourist Tax */}
      <div className="bg-white border border-gray-200 rounded-[24px] p-6 sm:p-8 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">💰</span>
          <h2 className="text-xl sm:text-2xl font-black text-black">Tourist Tax (Imposta di Soggiorno)</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 mb-1">Municipality</div>
            <div className="font-semibold text-black">
              {complianceData.tourist_tax?.municipality || "—"}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 mb-1">Collection Status</div>
            <div className="font-semibold text-black">
              {complianceData.tourist_tax?.collection_status || "—"}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 mb-1">Reporting Status</div>
            <div className="font-semibold text-black">
              {complianceData.tourist_tax?.reporting_status || "—"}
            </div>
          </div>
        </div>
        {complianceData.tourist_tax?.rate_notes && (
          <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-xs font-semibold text-amber-900 mb-1">Rate Notes</div>
            <div className="text-sm text-amber-800">
              {complianceData.tourist_tax.rate_notes}
            </div>
          </div>
        )}
        {complianceData.tourist_tax?.guest_exemption_notes && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-xs font-semibold text-blue-900 mb-1">Guest Exemption Notes</div>
            <div className="text-sm text-blue-800">
              {complianceData.tourist_tax.guest_exemption_notes}
            </div>
          </div>
        )}
      </div>

      {/* Section 4: ISTAT & Regional Statistics */}
      <div className="bg-white border border-gray-200 rounded-[24px] p-6 sm:p-8 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📊</span>
          <h2 className="text-xl sm:text-2xl font-black text-black">ISTAT & Regional Statistics</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 mb-1">Portal Name</div>
            <div className="font-semibold text-black">
              {complianceData.istat_regional?.portal_name || "—"}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 mb-1">Reporting Status</div>
            <div className="font-semibold text-black">
              {complianceData.istat_regional?.reporting_status || "—"}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 sm:col-span-2">
            <div className="text-xs font-semibold text-gray-600 mb-1">Monthly Status</div>
            <div className="font-semibold text-black">
              {complianceData.istat_regional?.monthly_status || "—"}
            </div>
          </div>
        </div>
        {complianceData.istat_regional?.notes && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-xs font-semibold text-blue-900 mb-1">Notes</div>
            <div className="text-sm text-blue-800">{complianceData.istat_regional.notes}</div>
          </div>
        )}
      </div>

      {/* Section 5: Safety Checklist */}
      <div className="bg-white border border-gray-200 rounded-[24px] p-6 sm:p-8 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🔒</span>
          <h2 className="text-xl sm:text-2xl font-black text-black">Safety Checklist</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-lg">💨</span>
              <span className="font-semibold text-black">Smoke Detector</span>
            </div>
            <div className="text-sm font-semibold">
              {complianceData.safety_checklist?.smoke_detector ? (
                <span className="text-green-600">✓ Installed</span>
              ) : (
                <span className="text-gray-500">—</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-lg">☠️</span>
              <span className="font-semibold text-black">CO Detector</span>
            </div>
            <div className="text-sm font-semibold">
              {complianceData.safety_checklist?.carbon_monoxide_detector ? (
                <span className="text-green-600">✓ Installed</span>
              ) : (
                <span className="text-gray-500">—</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-lg">🚨</span>
              <span className="font-semibold text-black">Gas Detector</span>
            </div>
            <div className="text-sm font-semibold">
              {complianceData.safety_checklist?.gas_detector ? (
                <span className="text-green-600">✓ Installed</span>
              ) : (
                <span className="text-gray-500">—</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-lg">🧯</span>
              <span className="font-semibold text-black">Fire Extinguisher</span>
            </div>
            <div className="text-sm font-semibold">
              {complianceData.safety_checklist?.fire_extinguisher ? (
                <span className="text-green-600">✓ Available</span>
              ) : (
                <span className="text-gray-500">—</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-lg">📞</span>
              <span className="font-semibold text-black">Emergency Numbers Posted</span>
            </div>
            <div className="text-sm font-semibold">
              {complianceData.safety_checklist?.emergency_numbers_posted ? (
                <span className="text-green-600">✓ Posted</span>
              ) : (
                <span className="text-gray-500">—</span>
              )}
            </div>
          </div>
        </div>
        {complianceData.safety_checklist?.safety_notes && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-xs font-semibold text-blue-900 mb-1">Safety Notes</div>
            <div className="text-sm text-blue-800">
              {complianceData.safety_checklist.safety_notes}
            </div>
          </div>
        )}
      </div>

      {/* Section 6: Document Archive */}
      <div className="bg-white border border-gray-200 rounded-[24px] p-6 sm:p-8 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📁</span>
          <h2 className="text-xl sm:text-2xl font-black text-black">Document Archive</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-lg">🎖️</span>
              <span className="font-semibold text-black">CIN Certificate</span>
            </div>
            <div className="text-sm font-semibold">
              {complianceData.document_archive?.cin_certificate_available ? (
                <span className="text-green-600">✓ Available</span>
              ) : (
                <span className="text-gray-500">—</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-lg">📄</span>
              <span className="font-semibold text-black">Property Documents</span>
            </div>
            <div className="text-sm font-semibold">
              {complianceData.document_archive?.property_documents_available ? (
                <span className="text-green-600">✓ Available</span>
              ) : (
                <span className="text-gray-500">—</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-lg">👤</span>
              <span className="font-semibold text-black">Guest Documents</span>
            </div>
            <div className="text-sm font-semibold">
              {complianceData.document_archive?.guest_documents_available ? (
                <span className="text-green-600">✓ Available</span>
              ) : (
                <span className="text-gray-500">—</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-lg">🧾</span>
              <span className="font-semibold text-black">Tax Receipts</span>
            </div>
            <div className="text-sm font-semibold">
              {complianceData.document_archive?.tax_receipts_available ? (
                <span className="text-green-600">✓ Available</span>
              ) : (
                <span className="text-gray-500">—</span>
              )}
            </div>
          </div>
        </div>
        {complianceData.document_archive?.notes && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-xs font-semibold text-blue-900 mb-1">Notes</div>
            <div className="text-sm text-blue-800">{complianceData.document_archive.notes}</div>
          </div>
        )}
      </div>

      {/* Section 7: Compliance Status Summary */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-[24px] p-6 sm:p-8 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📈</span>
          <h2 className="text-xl sm:text-2xl font-black text-black">Compliance Status Summary</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 mb-2">Completed Items</div>
            <div className="text-2xl font-black text-emerald-600 mb-1">
              {completedItems}/{totalItems}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{
                  width: totalItems > 0 ? `${(completedItems / totalItems) * 100}%` : "0%",
                }}
              />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 mb-2">Compliance Score</div>
            <div className="text-2xl font-black text-blue-600 mb-1">
              {Math.round(complianceScore)}%
            </div>
            <div className="text-xs text-gray-500">Overall compliance status</div>
          </div>
        </div>
        {complianceData.compliance_status?.next_deadline && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-xs font-semibold text-amber-900 mb-1">📅 Next Deadline</div>
            <div className="text-sm font-semibold text-amber-800">
              {new Date(complianceData.compliance_status.next_deadline).toLocaleDateString()}
            </div>
          </div>
        )}
        {complianceData.compliance_status?.last_updated && (
          <div className="mt-2 text-xs text-gray-500">
            Last updated: {new Date(complianceData.compliance_status.last_updated).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}
