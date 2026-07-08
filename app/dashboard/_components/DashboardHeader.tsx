 "use client";

import type { PropertyReadiness } from "../_lib/property-readiness";

interface DashboardHeaderProps {
  propertyName: string;
  commandLocationLabel: string;
  aiEnabled: boolean;
  isPartnerMode: boolean;
  readiness: PropertyReadiness;
}

function getHostStatus(readiness: PropertyReadiness) {
  const missingCount = readiness.nextActions.length;

  if (missingCount === 0) {
    return {
      icon: "🟢",
      label: "Ready for Guests",
      tone: "bg-emerald-400/10 border-emerald-300/20 text-emerald-100",
    };
  }

  if (readiness.overallScore >= 85) {
    return {
      icon: "🟡",
      label: `${missingCount} actions remaining`,
      tone: "bg-amber-400/10 border-amber-300/20 text-amber-100",
    };
  }

  return {
    icon: "🟠",
    label: "Setup needed",
    tone: "bg-orange-400/10 border-orange-300/20 text-orange-100",
  };
}

export function DashboardHeader({
  propertyName,
  commandLocationLabel,
  aiEnabled,
  isPartnerMode,
  readiness,
}: DashboardHeaderProps) {
  const status = getHostStatus(readiness);

  return (
    <div className="bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white px-6 py-9 shadow-2xl">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-7">
          <div>
            <div className="uppercase tracking-[0.3em] text-xs text-white/50 mb-4">
              AI CO-HOST PLATFORM
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Property Dashboard
            </h1>

            <p className="text-white/70 text-base md:text-lg max-w-2xl leading-relaxed">
              Manage your property, guest experience, AI concierge and daily operations from one simple place.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${status.tone}`}
              >
                <span>{status.icon}</span>
                <span>{status.label}</span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-4 py-2 text-sm text-white/80">
                <span>{aiEnabled ? "🤖" : "⏸️"}</span>
                <span>AI Concierge {aiEnabled ? "Active" : "Off"}</span>
              </div>

              {isPartnerMode && (
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 border border-emerald-300/20 px-4 py-2 text-sm text-emerald-100">
                  <span>Limited Partner Access</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/10 min-w-full lg:min-w-[320px]">
            <div className="text-white/50 text-xs uppercase tracking-[0.25em] mb-3">
              Selected Property
            </div>

            <div className="text-2xl font-black leading-tight">
              {propertyName || "No property selected"}
            </div>

            <div className="text-white/50 text-sm mt-2">
              {commandLocationLabel || "Location not set"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}