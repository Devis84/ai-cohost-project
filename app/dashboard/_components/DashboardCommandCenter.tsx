 "use client";

import { CommandCard } from "./DashboardUi";
import type { PropertyReadiness } from "../_lib/property-readiness";

function getSetupMessage(score: number, missingCount: number) {
  if (missingCount === 0) {
    return "Everything is ready. Your AI Co-Host is fully configured.";
  }

  if (score >= 85) {
    return `Almost ready. Complete ${missingCount} final ${
      missingCount === 1 ? "step" : "steps"
    } to give guests the best experience.`;
  }

  return `Let’s finish the key setup. ${missingCount} ${
    missingCount === 1 ? "item needs" : "items need"
  } your attention.`;
}

function getActionHint(label: string) {
  const text = label.toLowerCase();

  if (text.includes("wifi") || text.includes("access")) {
    return "Guests usually need this right after arrival.";
  }

  if (text.includes("check")) {
    return "Reduce repetitive check-in and check-out questions.";
  }

  if (text.includes("clean")) {
    return "Help guests understand towels, cleaning and turnover rules.";
  }

  if (text.includes("local") || text.includes("restaurant")) {
    return "Improve guest recommendations and reduce manual messages.";
  }

  if (text.includes("emergency") || text.includes("safety")) {
    return "Important for guest confidence and safe stays.";
  }

  if (text.includes("ai") || text.includes("faq")) {
    return "Improve the quality and accuracy of AI replies.";
  }

  return "Complete this to improve the guest experience.";
}

function getActionTarget(label: string, category: string) {
  const value = `${label} ${category}`.toLowerCase();

  if (value.includes("ai") || value.includes("faq")) {
    return "ai";
  }

  if (
    value.includes("local") ||
    value.includes("restaurant") ||
    value.includes("guide")
  ) {
    return "localguide";
  }

  if (
    value.includes("guest page") ||
    value.includes("hero") ||
    value.includes("experience")
  ) {
    return "guestpage";
  }

  if (
    value.includes("extra") ||
    value.includes("service") ||
    value.includes("upsell")
  ) {
    return "extraservices";
  }

  return "general";
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
  readiness,
  loadingReadiness,
  extraServicesEnabled,
  wifiName,
  wifiPassword,
  onCopyWifi,
  onCopyGuestUrl,
  onOpenTab,
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
  onOpenTab: (tab: string) => void;
}) {
  const nextActions = readiness.nextActions.slice(0, 3);
  const missingCount = readiness.nextActions.length;
  const setupMessage = getSetupMessage(readiness.overallScore, missingCount);

  const completedItems = [
    commandAccessReady ? "Wi-Fi & access info" : "",
    commandGuestPageReady ? "Guest page" : "",
    commandWelcomeReady ? "Welcome book" : "",
    commandAiReady ? "AI Concierge" : "",
    aiEnabled ? "AI enabled" : "",
    extraServicesEnabled ? "Extra services" : "",
  ].filter(Boolean);

  return (
    <section className="mb-8 space-y-5">
      <div className="bg-white rounded-[32px] p-5 md:p-7 shadow-xl border border-black/5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div>
            <div className="uppercase tracking-[0.28em] text-xs text-gray-400 mb-3">
              AI CO-HOST DASHBOARD
            </div>

            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-950 mb-3">
              Today&apos;s Control Panel
            </h2>

            <p className="text-sm md:text-base text-gray-500 max-w-2xl leading-relaxed">
              Open, check and manage the most important areas of your property in a few seconds.
            </p>
          </div>

          <div className="bg-black text-white rounded-3xl p-5 min-w-full lg:min-w-[300px] shadow-lg">
            <div className="text-white/50 text-xs uppercase tracking-[0.25em] mb-3">
              Selected Property
            </div>

            <div className="text-2xl font-black leading-tight">
              {propertyName || "No property selected"}
            </div>

            <div className="text-white/50 text-sm mt-2">
              {commandLocationLabel || "Location not set"}
            </div>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-2 text-sm">
              <span>{missingCount === 0 ? "🟢" : "🟡"}</span>
              <span>
                {missingCount === 0
                  ? "Ready for Guests"
                  : `${missingCount} actions remaining`}
              </span>
            </div>

            <div className="mt-3 text-sm text-white/60">
              AI Concierge {aiEnabled ? "Active" : "Off"}
            </div>

            {loadingSelectedProperty && (
              <div className="mt-4 text-xs text-yellow-200">
                Loading selected property...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#f4f1eb] rounded-[32px] p-5 md:p-7 shadow-xl border border-black/5">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center text-2xl">
                🤖
              </div>

              <div>
                <div className="text-xl md:text-2xl font-black text-gray-950">
                  Property Setup Assistant
                </div>
                <div className="text-sm text-gray-500">
                  The fastest way to finish this property setup.
                </div>
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-end justify-between gap-4 mb-2">
                <div className="text-sm text-gray-600 leading-relaxed">
                  {setupMessage}
                </div>

                <div className="text-2xl font-black text-gray-950">
                  {readiness.overallScore}%
                </div>
              </div>

              <div className="h-3 bg-white rounded-full overflow-hidden border border-black/5">
                <div
                  className="h-full bg-black rounded-full transition-all"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, readiness.overallScore)
                    )}%`,
                  }}
                />
              </div>

              {loadingReadiness && (
                <div className="mt-2 text-xs text-gray-500">
                  Updating setup status...
                </div>
              )}
            </div>

            {missingCount === 0 ? (
              <div className="bg-white rounded-3xl p-5 border border-black/5">
                <div className="text-2xl mb-2">🎉</div>

                <div className="font-black text-gray-950 mb-1">
                  Everything is ready.
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  Your AI Co-Host is configured and ready to support guests.
                </div>

                <a
                  href={guestPageUrl || "#"}
                  className={`inline-flex rounded-2xl px-4 py-3 text-sm font-bold ${
                    guestPageUrl
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-400 pointer-events-none"
                  }`}
                >
                  Preview Guest Experience →
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {nextActions.map((action) => {
                  const targetTab = getActionTarget(
                    action.label,
                    action.category
                  );

                  return (
                    <div
                      key={action.id}
                      className="bg-white rounded-3xl p-4 border border-black/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span>⚠️</span>
                          <span className="font-black text-gray-950">
                            {action.label}
                          </span>
                        </div>

                        <div className="text-sm text-gray-500 leading-relaxed">
                          {getActionHint(action.label)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenTab(targetTab)}
                        className="rounded-2xl bg-black text-white px-4 py-3 text-sm font-bold whitespace-nowrap"
                      >
                        Open →
                      </button>
                    </div>
                  );
                })}

                {missingCount > 3 && (
                  <div className="text-xs text-gray-500 pl-1">
                    + {missingCount - 3} more setup items available in the dashboard.
                  </div>
                )}
              </div>
            )}
          </div>

          {completedItems.length > 0 && (
            <div className="lg:w-[300px] bg-white rounded-3xl p-5 border border-black/5">
              <div className="font-black text-gray-950 mb-3">
                Already done
              </div>

              <div className="space-y-2">
                {completedItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <span className="h-5 w-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs">
                      ✓
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-[32px] p-5 md:p-6 shadow-xl border border-black/5">
          <div className="mb-4">
            <div className="text-xl font-black text-gray-950">
              Daily Operations
            </div>
            <div className="text-sm text-gray-500">
              The tools you use during the day.
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <CommandCard
              icon="💬"
              title="Inbox"
              description="Guest conversations and messages that may need attention."
              href="/dashboard/inbox"
            />
            <CommandCard
              icon="📅"
              title="Bookings"
              description="Upcoming arrivals, active stays and booking status."
              href="/dashboard/bookings"
            />
            <CommandCard
              icon="🧹"
              title="Cleaning"
              description="Turnovers, cleaner tasks and property readiness."
              href="/dashboard/cleaning"
            />
            <CommandCard
              icon="🚨"
              title="Issues"
              description="Escalations, problems and urgent guest requests."
              href="/dashboard/issues"
            />
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-5 md:p-6 shadow-xl border border-black/5">
          <div className="mb-4">
            <div className="text-xl font-black text-gray-950">
              Property Setup
            </div>
            <div className="text-sm text-gray-500">
              Configure what guests see and what the AI knows.
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <CommandCard
              icon="✨"
              title="Guest Page"
              description="Preview the guest-facing experience."
              href={guestPageUrl || undefined}
              dark
              disabled={!guestPageUrl}
            />
            <CommandCard
              icon="📲"
              title="QR / NFC"
              description="Manage QR codes and NFC-ready links."
              href="/dashboard/qr"
            />
            <CommandCard
              icon="📶"
              title="Copy Wi-Fi"
              description="Copy Wi-Fi details for quick guest support."
              onClick={onCopyWifi}
              disabled={!wifiName && !wifiPassword}
            />
            <CommandCard
              icon="🔗"
              title="Copy Guest URL"
              description="Copy guest page link for Airbnb messages."
              onClick={onCopyGuestUrl}
              disabled={!guestPageUrl}
            />
          </div>
        </div>
      </div>
    </section>
  );
}