 "use client";

import type { PropertyReadiness } from "../_lib/property-readiness";
import type { Property } from "../_types/dashboard";

interface DashboardHeaderProps {
  propertyName: string;
  commandLocationLabel: string;
  aiEnabled: boolean;
  isPartnerMode: boolean;
  readiness: PropertyReadiness;
  properties: Property[];
  selectedSlug: string;
  loadingProperties: boolean;
  loadingSelectedProperty: boolean;
  onSelectProperty: (propertyIdentifier: string) => void;
}

function getHostStatus(readiness: PropertyReadiness) {
  const missingCount = readiness.nextActions.length;

  if (missingCount === 0) {
    return {
      icon: "🟢",
      label: "Ready for Guests",
      tone:
        "bg-emerald-400/10 border-emerald-300/20 text-emerald-100",
    };
  }

  if (readiness.overallScore >= 85) {
    return {
      icon: "🟡",
      label: `${missingCount} actions remaining`,
      tone:
        "bg-amber-400/10 border-amber-300/20 text-amber-100",
    };
  }

  return {
    icon: "🟠",
    label: "Setup needed",
    tone:
      "bg-orange-400/10 border-orange-300/20 text-orange-100",
  };
}

function getPropertyIdentifier(property: Property) {
  return property.slug || property.id || "";
}

function getPropertyLabel(property: Property) {
  return (
    property.property_name ||
    property.slug ||
    property.id ||
    "Unnamed property"
  );
}

export function DashboardHeader({
  propertyName,
  commandLocationLabel,
  aiEnabled,
  isPartnerMode,
  readiness,
  properties,
  selectedSlug,
  loadingProperties,
  loadingSelectedProperty,
  onSelectProperty,
}: DashboardHeaderProps) {
  const status = getHostStatus(readiness);

  const selectorDisabled =
    loadingProperties ||
    loadingSelectedProperty ||
    properties.length === 0;

  return (
    <header className="bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white px-4 sm:px-6 py-7 sm:py-9 shadow-2xl">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-7">
          <div className="min-w-0">
            <div className="uppercase tracking-[0.3em] text-xs text-white/50 mb-4">
              AI CO-HOST PLATFORM
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Property Dashboard
            </h1>

            <p className="text-white/70 text-base md:text-lg max-w-2xl leading-relaxed">
              Manage your property, guest experience, AI concierge
              and daily operations from one simple place.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${status.tone}`}
              >
                <span aria-hidden="true">{status.icon}</span>
                <span>{status.label}</span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-4 py-2 text-sm text-white/80">
                <span aria-hidden="true">
                  {aiEnabled ? "🤖" : "⏸️"}
                </span>

                <span>
                  AI Concierge {aiEnabled ? "Active" : "Off"}
                </span>
              </div>

              {isPartnerMode && (
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 border border-emerald-300/20 px-4 py-2 text-sm text-emerald-100">
                  <span>Limited Partner Access</span>
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-[420px] lg:flex-none bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/10">
            <label
              htmlFor="dashboard-property-selector"
              className="block text-white/50 text-xs uppercase tracking-[0.25em] mb-3"
            >
              Selected Property
            </label>

            <div className="relative">
              <select
                id="dashboard-property-selector"
                value={selectedSlug}
                disabled={selectorDisabled}
                onChange={(event) =>
                  onSelectProperty(event.target.value)
                }
                className="block w-full appearance-none rounded-2xl border border-white/15 bg-white px-4 py-4 pr-12 text-base font-black text-gray-950 outline-none transition focus:border-white focus:ring-4 focus:ring-white/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              >
                {properties.length === 0 && (
                  <option value="">
                    {loadingProperties
                      ? "Loading properties..."
                      : "No properties available"}
                  </option>
                )}

                {properties.map((property) => {
                  const identifier =
                    getPropertyIdentifier(property);

                  if (!identifier) {
                    return null;
                  }

                  return (
                    <option
                      key={identifier}
                      value={identifier}
                    >
                      {getPropertyLabel(property)}
                    </option>
                  );
                })}
              </select>

              <div
                className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-500"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.512a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-white/50 text-sm">
                {commandLocationLabel || "Location not set"}
              </div>

              {loadingSelectedProperty && (
                <div className="mt-3 inline-flex items-center gap-2 text-xs text-amber-200">
                  <span
                    className="h-2 w-2 rounded-full bg-amber-300 animate-pulse"
                    aria-hidden="true"
                  />

                  <span>Loading property data...</span>
                </div>
              )}

              {!loadingProperties &&
                !loadingSelectedProperty &&
                properties.length > 1 && (
                  <div className="mt-3 text-xs text-white/40">
                    {properties.length} properties available
                  </div>
                )}

              {!loadingProperties &&
                !loadingSelectedProperty &&
                properties.length === 1 && (
                  <div className="mt-3 text-xs text-white/40">
                    1 property available
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}