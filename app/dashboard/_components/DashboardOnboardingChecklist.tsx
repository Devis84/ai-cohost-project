"use client";

import type { PropertyReadiness } from "../_lib/property-readiness";

type ChecklistStepStatus = "completed" | "missing" | "optional";

type ChecklistStep = {
  id: string;
  title: string;
  description: string;
  status: ChecklistStepStatus;
  optional?: boolean;
  actionLabel: string;
  href?: string;
  tab?: "general" | "guestpage" | "welcomebook" | "localguide" | "smartsetup" | "ai";
};

function getStatusClasses(status: ChecklistStepStatus) {
  if (status === "completed") {
    return "bg-green-100 text-green-800 border-green-200";
  }

  if (status === "optional") {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }

  return "bg-rose-100 text-rose-800 border-rose-200";
}

function getStatusLabel(status: ChecklistStepStatus) {
  if (status === "completed") {
    return "Completed";
  }

  if (status === "optional") {
    return "Optional";
  }

  return "Missing";
}

export function DashboardOnboardingChecklist({
  propertyName,
  selectedSlug,
  guestPageUrl,
  readiness,
  loadingReadiness,
  onOpenTab,
}: {
  propertyName: string;
  selectedSlug: string;
  guestPageUrl: string;
  readiness: PropertyReadiness;
  loadingReadiness: boolean;
  onOpenTab: (
    tab: "general" | "guestpage" | "welcomebook" | "localguide" | "smartsetup" | "ai"
  ) => void;
}) {
  const signals = readiness.signals;

  const steps: ChecklistStep[] = [
    {
      id: "select-property",
      title: "Create or select property",
      description: "Pick an existing property or create a new one in Property Setup.",
      status:
        Boolean(selectedSlug) || Boolean(propertyName.trim())
          ? "completed"
          : "missing",
      actionLabel: "Open Property Setup",
      tab: "general",
    },
    {
      id: "property-basics",
      title: "Add property basics",
      description: "Complete city, country and address to unlock better guest and compliance guidance.",
      status: signals.propertyBasicsComplete ? "completed" : "missing",
      actionLabel: "Edit Basics",
      tab: "general",
    },
    {
      id: "wifi",
      title: "Add WiFi",
      description: "Set WiFi name and password so guests can self-serve access details.",
      status: signals.wifiConfigured ? "completed" : "missing",
      actionLabel: "Set WiFi",
      tab: "general",
    },
    {
      id: "checkin",
      title: "Add check-in instructions",
      description: "Provide clear arrival instructions for smoother guest onboarding.",
      status: signals.checkinConfigured ? "completed" : "missing",
      actionLabel: "Edit Check-in",
      tab: "general",
    },
    {
      id: "house-rules",
      title: "Add house rules",
      description: "Define essential rules to prevent misunderstandings during the stay.",
      status: signals.houseRulesConfigured ? "completed" : "missing",
      actionLabel: "Edit Welcome Book",
      tab: "welcomebook",
    },
    {
      id: "local-guide",
      title: "Add local guide",
      description: "Include neighborhood and recommendations to improve guest experience.",
      status: signals.localGuideConfigured ? "completed" : "missing",
      actionLabel: "Edit Local Guide",
      tab: "localguide",
    },
    {
      id: "ai-draft",
      title: "Generate AI draft content",
      description: "Use Smart Setup Assistant to draft guest content and AI knowledge quickly.",
      status: signals.draftContentAvailable ? "completed" : "missing",
      actionLabel: "Open Smart Setup",
      tab: "smartsetup",
    },
    {
      id: "guest-preview",
      title: "Preview Guest Page",
      description: "Check how guests see your page before going live.",
      status: signals.guestPagePreviewReady ? "completed" : "missing",
      actionLabel: guestPageUrl ? "Open Guest Page" : "Open Guest Page Editor",
      href: guestPageUrl || undefined,
      tab: guestPageUrl ? undefined : "guestpage",
    },
    {
      id: "test-ai",
      title: "Test AI Concierge",
      description: "Send a test question to validate AI answers and escalation quality.",
      status: signals.aiConciergeReady ? "completed" : "missing",
      actionLabel: "Open AI Concierge",
      href: "/dashboard/chat",
    },
    {
      id: "calendar-optional",
      title: "Optional: connect calendar/channel manager",
      description: "Connect iCal sources and sync booking data for operations automation.",
      status: signals.operationsConnected ? "completed" : "optional",
      optional: true,
      actionLabel: "Open Channel Manager",
      href: "/dashboard/channel-manager/sources",
    },
    {
      id: "italy-optional",
      title: "Optional: enable Italian Compliance for Italy",
      description: signals.italianProperty
        ? "Enable and complete Italy-specific compliance only when your property is in Italy."
        : "Not required unless the property is in Italy.",
      status:
        signals.italianProperty && signals.italianComplianceEnabled
          ? "completed"
          : "optional",
      optional: true,
      actionLabel: "Open Italian Compliance",
      href: "/dashboard/italy-compliance",
    },
  ];

  const requiredSteps = steps.filter((step) => !step.optional);
  const requiredCompleted = requiredSteps.filter(
    (step) => step.status === "completed"
  ).length;

  const progress = requiredSteps.length
    ? Math.round((requiredCompleted / requiredSteps.length) * 100)
    : 0;

  return (
    <section className="bg-white rounded-[32px] p-6 md:p-7 shadow-xl border border-black/5 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <div className="uppercase tracking-[0.3em] text-xs text-gray-400 mb-2">
            HOST ONBOARDING
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-950 mb-2">
            Setup Checklist
          </h2>
          <p className="text-sm md:text-base text-gray-500 leading-relaxed">
            Complete the core setup tasks to launch your property faster with fewer manual checks.
          </p>
        </div>

        <div className="rounded-3xl bg-black text-white p-5 min-w-[260px]">
          <div className="text-white/60 text-xs uppercase tracking-[0.2em] mb-2">
            Required Steps
          </div>
          <div className="text-3xl font-black mb-2">
            {requiredCompleted}/{requiredSteps.length}
          </div>
          <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-white/70 mt-2">{progress}% completed</div>
          {loadingReadiness && (
            <div className="text-xs text-white/60 mt-2">Refreshing readiness...</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {steps.map((step) => {
          const icon =
            step.status === "completed"
              ? "✅"
              : step.status === "optional"
                ? "🧩"
                : "⚠️";

          const actionButton = step.href ? (
            <a
              href={step.href}
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-black text-white px-3 py-2 text-sm font-semibold hover:opacity-90 transition"
            >
              {step.actionLabel}
            </a>
          ) : (
            <button
              type="button"
              onClick={() => step.tab && onOpenTab(step.tab)}
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-black text-white px-3 py-2 text-sm font-semibold hover:opacity-90 transition"
            >
              {step.actionLabel}
            </button>
          );

          return (
            <div
              key={step.id}
              className="rounded-2xl border border-black/10 bg-[#f7f6f2] p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-gray-900 leading-snug flex items-start gap-2">
                  <span>{icon}</span>
                  <span>{step.title}</span>
                </h3>
                <span
                  className={`text-[11px] border rounded-full px-2 py-1 whitespace-nowrap ${getStatusClasses(
                    step.status
                  )}`}
                >
                  {getStatusLabel(step.status)}
                </span>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-3">{step.description}</p>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-xs text-gray-500">
                  {step.optional ? "Optional step" : "Required step"}
                </div>
                {actionButton}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
