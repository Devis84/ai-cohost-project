"use client";

import { CommandCard, StatusPill } from "./DashboardUi";
import type {
  PropertyReadiness,
  ReadinessLevel,
} from "../_lib/property-readiness";

function readinessTone(status: ReadinessLevel) {
  if (status === "Ready") {
    return "bg-green-100 text-green-800 border-green-200";
  }

  if (status === "Warning") {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }

  return "bg-rose-100 text-rose-800 border-rose-200";
}

export function DashboardCommandCenter({
  propertyName,
  aiEnabled,
  commandLocationLabel,
  guestPageUrl,
  loadingSelectedProperty,
  commandGuestPageReady,
  commandWelcomeReady,
  commandAiReady,
  commandAccessReady,
  commandExtraServicesReady,
  readiness,
  loadingReadiness,
  extraServicesEnabled,
  wifiName,
  wifiPassword,
  onCopyWifi,
  onCopyGuestUrl,
}: {
  propertyName: string;
  aiEnabled: boolean;
  commandLocationLabel: string;
  guestPageUrl: string;
  loadingSelectedProperty: boolean;
  commandGuestPageReady: boolean;
  commandWelcomeReady: boolean;
  commandAiReady: boolean;
  commandAccessReady: boolean;
  commandExtraServicesReady: boolean;
  readiness: PropertyReadiness;
  loadingReadiness: boolean;
  extraServicesEnabled: boolean;
  wifiName: string;
  wifiPassword: string;
  onCopyWifi: () => void;
  onCopyGuestUrl: () => void;
}) {
  return (
    <section className="bg-white rounded-[32px] p-6 md:p-7 shadow-xl border border-black/5 mb-8">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6 mb-7">
        <div>
          <div className="uppercase tracking-[0.3em] text-xs text-gray-400 mb-3">
            AI CO-HOST COMMAND CENTER
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-950 mb-3">
            Today&apos;s Host Control Panel
          </h2>
          <p className="text-sm md:text-base text-gray-500 max-w-2xl leading-relaxed">
            Fast access to the most important operational areas for the selected property: guest page, QR/NFC, inbox, issues, notifications and cleaning.
          </p>
        </div>

        <div className="bg-black text-white rounded-3xl p-5 min-w-full xl:min-w-[320px] shadow-lg">
          <div className="text-white/50 text-xs uppercase tracking-[0.25em] mb-3">
            Selected Property
          </div>
          <div className="text-2xl font-black leading-tight">
            {propertyName || "No property selected"}
          </div>
          <div className="text-white/50 text-sm mt-2">
            {commandLocationLabel || "Location not set"}
          </div>

          {guestPageUrl && (
            <div className="text-white/40 text-xs mt-4 break-all">
              {guestPageUrl}
            </div>
          )}

          {loadingSelectedProperty && (
            <div className="mt-4 text-xs text-yellow-200">
              Loading selected property...
            </div>
          )}

          <div className="mt-5 rounded-2xl bg-white/10 border border-white/20 p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-white/60 mb-2">
              Property Readiness
            </div>
            <div className="flex items-end gap-3">
              <div className="text-4xl font-black leading-none">
                {readiness.overallScore}%
              </div>
              <span
                className={`text-xs border rounded-full px-2.5 py-1 ${readinessTone(
                  readiness.overallStatus
                )}`}
              >
                {readiness.overallStatus}
              </span>
            </div>
            {loadingReadiness && (
              <div className="mt-2 text-[11px] text-white/60">
                Updating operations signals...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <CommandCard
          icon="✨"
          title="Open Guest Page"
          description="Preview the guest-facing experience exactly as guests will see it from QR/NFC."
          href={guestPageUrl || undefined}
          dark
          disabled={!guestPageUrl}
        />
        <CommandCard
          icon="📲"
          title="QR / NFC"
          description="Manage guest access QR codes and NFC-ready links for the selected property."
          href="/dashboard/qr"
        />
        <CommandCard
          icon="💬"
          title="Inbox"
          description="Review guest conversations, AI replies and messages that may need host attention."
          href="/dashboard/inbox"
        />
        <CommandCard
          icon="🚨"
          title="Issues"
          description="Open the guest problem center and check escalations, complaints and access problems."
          href="/dashboard/issues"
        />
        <CommandCard
          icon="🔔"
          title="Notifications"
          description="Monitor high-priority alerts, unread items and AI operational notifications."
          href="/dashboard/notifications"
        />
        <CommandCard
          icon="🧹"
          title="Cleaning"
          description="Manage turnovers, cleaner assignments, checklist progress and payment estimates."
          href="/dashboard/cleaning"
        />
        <CommandCard
          icon="📶"
          title="Copy Wi-Fi"
          description="Copy the current Wi-Fi network and password for quick guest support."
          onClick={onCopyWifi}
          disabled={!wifiName && !wifiPassword}
        />
        <CommandCard
          icon="🔗"
          title="Copy Guest URL"
          description="Copy the selected property guest page URL for Airbnb messages, QR or NFC setup."
          onClick={onCopyGuestUrl}
          disabled={!guestPageUrl}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-7">
        <StatusPill
          label="AI Concierge"
          value={aiEnabled ? "ON" : "OFF"}
          active={commandAiReady}
        />
        <StatusPill
          label="Guest Page"
          value={commandGuestPageReady ? "Ready" : "Needs setup"}
          active={commandGuestPageReady}
        />
        <StatusPill
          label="Welcome Book"
          value={commandWelcomeReady ? "Ready" : "Needs content"}
          active={commandWelcomeReady}
        />
        <StatusPill
          label="Access Info"
          value={commandAccessReady ? "Configured" : "Incomplete"}
          active={commandAccessReady}
        />
        <StatusPill
          label="Extra Services"
          value={extraServicesEnabled ? "ON" : "OFF"}
          active={commandExtraServicesReady}
        />
      </div>

      <div className="bg-[#eef3e7] rounded-3xl p-5 border border-black/5 mb-7">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="font-black text-gray-950">
            Readiness by category
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-gray-500">
            Unified scoring engine
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {readiness.categories.map((category) => {
            return (
              <div
                key={category.key}
                className="bg-white rounded-2xl p-4 border border-black/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-gray-900">
                    {category.label}
                  </div>
                  <span
                    className={`text-[11px] border rounded-full px-2 py-1 ${readinessTone(
                      category.status
                    )}`}
                  >
                    {category.status}
                  </span>
                </div>
                <div className="mt-3 text-2xl font-black text-gray-950">
                  {category.percentage}%
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Ready {category.ready} • Warning {category.warning} • Missing{" "}
                  {category.missing}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-[#f4f1eb] rounded-3xl p-5 border border-black/5">
        <div className="font-black text-gray-950 mb-3">
          What should I do next?
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-700">
          {readiness.nextActions.length === 0 && (
            <div className="bg-white rounded-2xl p-4 border border-black/5 lg:col-span-3">
              <div className="font-semibold text-gray-900 mb-1">No urgent blockers detected</div>
              <div className="text-sm text-gray-600">Your property setup is in good shape. Continue refining guest content or review operations.</div>
            </div>
          )}

          {readiness.nextActions.map((action) => {
            const badgeClass =
              action.status === "missing"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-amber-50 text-amber-700 border-amber-200";

            return (
              <div
                key={action.id}
                className="bg-white rounded-2xl p-4 border border-black/5"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="font-bold text-gray-900">
                    {action.label}
                  </span>
                  <span
                    className={`text-[11px] border rounded-full px-2 py-1 uppercase ${badgeClass}`}
                  >
                    {action.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Category: {action.category.replace(/_/g, " ")}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
