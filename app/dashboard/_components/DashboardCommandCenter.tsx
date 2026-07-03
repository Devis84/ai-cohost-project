"use client";

import {

  CommandCard,

  StatusPill,

} from "./DashboardUi";

export function DashboardCommandCenter({

  propertyName,

  propertiesCount,

  aiEnabled,

  commandLocationLabel,

  guestPageUrl,

  loadingSelectedProperty,

  commandGuestPageReady,

  commandWelcomeReady,

  commandAiReady,

  commandAccessReady,

  commandExtraServicesReady,

  extraServicesEnabled,

  wifiName,

  wifiPassword,

  onCopyWifi,

  onCopyGuestUrl,

}: {

  propertyName: string;

  propertiesCount: number;

  aiEnabled: boolean;

  commandLocationLabel: string;

  guestPageUrl: string;

  loadingSelectedProperty: boolean;

  commandGuestPageReady: boolean;

  commandWelcomeReady: boolean;

  commandAiReady: boolean;

  commandAccessReady: boolean;

  commandExtraServicesReady: boolean;

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

          <h2 className="text-3xl font-black text-gray-950 mb-3">

            Today’s Host Control Panel

          </h2>

          <p className="text-gray-500 max-w-2xl leading-relaxed">

            Fast access to the most important operational areas for the selected property: guest page, QR/NFC, inbox, issues, notifications and cleaning.

          </p>

        </div>

        <div className="bg-black text-white rounded-3xl p-5 min-w-full xl:min-w-[320px]">

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

      <div className="bg-[#f4f1eb] rounded-3xl p-5 border border-black/5">

        <div className="font-black text-gray-950 mb-3">

          What to check today

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-sm text-gray-700">

          <div className="bg-white rounded-2xl p-4">

            {commandGuestPageReady ? "✅" : "⚠️"} Guest page content

          </div>

          <div className="bg-white rounded-2xl p-4">

            {commandAccessReady ? "✅" : "⚠️"} Wi-Fi and access info

          </div>

          <div className="bg-white rounded-2xl p-4">

            {commandAiReady ? "✅" : "⚠️"} AI training and escalation rules

          </div>

          <div className="bg-white rounded-2xl p-4">

            {commandExtraServicesReady ? "✅" : "⚠️"} Extra services

          </div>

          <div className="bg-white rounded-2xl p-4">

            🧹 Cleaning and turnover tasks

          </div>

        </div>

      </div>

    </section>

  );

}