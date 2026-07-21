 "use client";

import { useEffect, useMemo, useState } from "react";

import {
  buildPropertyQualityReport,
  type PropertyQualityIssue,
  type PropertyQualityReport,
  type PropertyQualityStatus,
} from "../_lib/property-quality-checker";

import {
  getPropertyIdentifier,
  mergeKnowledgeBase,
} from "../_lib/dashboard-utils";

import type { Property } from "../_types/dashboard";

type QaStatus = "not_tested" | "passed" | "failed";
type QaPriority = "high" | "medium" | "low";

type QaScenario = {
  id: string;
  title: string;
  description: string;
};

type QaScenarioState = {
  status: QaStatus;
  priority: QaPriority;
  notes: string;
};

type QaStateMap = Record<string, QaScenarioState>;

const RELEASE_QA_STORAGE_KEY =
  "ai_cohost_release_qa_checklist_v1";

const scenarios: QaScenario[] = [
  {
    id: "property_creation",
    title: "Property Creation",
    description:
      "Create a new property from dashboard setup and verify it appears in the property selector.",
  },
  {
    id: "property_save_load",
    title: "Property Save / Load",
    description:
      "Save property details and knowledge sections, reload the page and confirm all data persists correctly.",
  },
  {
    id: "guest_page_opening",
    title: "Guest Page Opening",
    description:
      "Open the public Guest Page and verify all content sections render without errors.",
  },
  {
    id: "qr_guest_url",
    title: "Guest Access / QR / NFC",
    description:
      "Verify Guest Access links, QR codes and NFC-ready URLs resolve to the correct property.",
  },
  {
    id: "ai_chat",
    title: "AI Chat",
    description:
      "Send guest-style questions and verify replies are accurate, property-specific and free from invented information.",
  },
  {
    id: "expired_stay_lifecycle",
    title: "Expired Stay Lifecycle",
    description:
      "Validate upcoming, active, grace-period and expired stay access behavior.",
  },
  {
    id: "booking_management",
    title: "Booking Management",
    description:
      "Review booking tabs, filters, arrivals, active stays and booking action links.",
  },
  {
    id: "cleaning_workflow",
    title: "Cleaning Workflow",
    description:
      "Verify cleaning tasks, status transitions and cleaner-facing workflow behavior.",
  },
  {
    id: "conversations",
    title: "Conversations",
    description:
      "Check conversation filters, selected thread view and mark-read behavior.",
  },
  {
    id: "analytics",
    title: "Analytics",
    description:
      "Validate analytics cards, breakdowns and empty states for low-data properties.",
  },
  {
    id: "channel_manager_sync",
    title: "Channel Manager / Calendar Sync",
    description:
      "Test calendar source creation, deletion, synchronization and sync logs.",
  },
  {
    id: "italian_compliance_optional",
    title: "Italian Compliance Optional Module",
    description:
      "Verify the module across no-property, non-Italy, disabled and enabled states.",
  },
  {
    id: "ai_auto_populate",
    title: "AI Auto Populate",
    description:
      "Run Smart Setup Assistant generation, preview and apply-to-form workflows.",
  },
  {
    id: "partner_access",
    title: "Partner Access",
    description:
      "Validate property visibility and restrictions for partner and view-only accounts.",
  },
];

function createInitialState(): QaStateMap {
  return scenarios.reduce<QaStateMap>(
    (accumulator, scenario) => {
      accumulator[scenario.id] = {
        status: "not_tested",
        priority: "medium",
        notes: "",
      };

      return accumulator;
    },
    {}
  );
}

function normalizeStatus(value: string): QaStatus {
  if (value === "passed" || value === "failed") {
    return value;
  }

  return "not_tested";
}

function normalizePriority(value: string): QaPriority {
  if (value === "high" || value === "low") {
    return value;
  }

  return "medium";
}

function getStatusBadgeClass(status: QaStatus) {
  if (status === "passed") {
    return "bg-emerald-50 border-emerald-100 text-emerald-700";
  }

  if (status === "failed") {
    return "bg-red-50 border-red-100 text-red-700";
  }

  return "bg-gray-100 border-gray-200 text-gray-600";
}

function getPriorityBadgeClass(priority: QaPriority) {
  if (priority === "high") {
    return "bg-red-50 border-red-100 text-red-700";
  }

  if (priority === "low") {
    return "bg-blue-50 border-blue-100 text-blue-700";
  }

  return "bg-amber-50 border-amber-100 text-amber-700";
}

function getStatusLabel(status: QaStatus) {
  if (status === "not_tested") {
    return "Not tested";
  }

  if (status === "passed") {
    return "Passed";
  }

  return "Failed";
}

function getQualityStatusLabel(
  status: PropertyQualityStatus
) {
  if (status === "ready") {
    return "Ready for Production";
  }

  if (status === "needs_review") {
    return "Needs Review";
  }

  return "Blocked";
}

function getQualityStatusClass(
  status: PropertyQualityStatus
) {
  if (status === "ready") {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (status === "needs_review") {
    return "border-amber-100 bg-amber-50 text-amber-700";
  }

  return "border-rose-100 bg-rose-50 text-rose-700";
}

function getQualityIcon(status: PropertyQualityStatus) {
  if (status === "ready") {
    return "✅";
  }

  if (status === "needs_review") {
    return "⚠️";
  }

  return "⛔";
}

function QualityIssueCard({
  issue,
}: {
  issue: PropertyQualityIssue;
}) {
  const critical = issue.severity === "critical";

  return (
    <div
      className={`rounded-2xl border p-4 ${
        critical
          ? "border-rose-100 bg-rose-50"
          : "border-amber-100 bg-amber-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
            critical
              ? "bg-rose-100 text-rose-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {critical ? "!" : "i"}
        </div>

        <div>
          <div
            className={`font-black ${
              critical
                ? "text-rose-950"
                : "text-amber-950"
            }`}
          >
            {issue.label}
          </div>

          <p
            className={`mt-1 text-sm leading-relaxed ${
              critical
                ? "text-rose-800/75"
                : "text-amber-800/75"
            }`}
          >
            {issue.description}
          </p>

          <div className="mt-2 text-xs font-bold uppercase tracking-[0.16em] opacity-60">
            Section: {issue.section}
          </div>
        </div>
      </div>
    </div>
  );
}

function PropertyQualityCard({
  report,
}: {
  report: PropertyQualityReport;
}) {
  const [expanded, setExpanded] = useState(
    report.status === "blocked"
  );

  const dashboardUrl = report.propertyIdentifier
    ? `/dashboard?property=${encodeURIComponent(
        report.propertyIdentifier
      )}`
    : "/dashboard";

  return (
    <article className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-sm">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${getQualityStatusClass(
                  report.status
                )}`}
              >
                <span aria-hidden="true">
                  {getQualityIcon(report.status)}
                </span>

                {getQualityStatusLabel(report.status)}
              </span>

              <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-xs font-black text-zinc-600">
                {report.score}% quality score
              </span>
            </div>

            <h3 className="mt-4 text-2xl font-black text-zinc-950">
              {report.propertyName}
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              {report.location}
            </p>

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-600">
              <span>
                <strong className="text-zinc-950">
                  {report.passedChecks}
                </strong>{" "}
                checks passed
              </span>

              <span>
                <strong className="text-rose-700">
                  {report.criticalIssues.length}
                </strong>{" "}
                critical
              </span>

              <span>
                <strong className="text-amber-700">
                  {report.warnings.length}
                </strong>{" "}
                warnings
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <a
              href={dashboardUrl}
              className="rounded-2xl bg-black px-4 py-3 text-sm font-black text-white transition hover:opacity-90"
            >
              Open Property
            </a>

            {report.allIssues.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setExpanded((current) => !current)
                }
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-black text-zinc-950 transition hover:bg-zinc-100"
              >
                {expanded
                  ? "Hide Issues"
                  : `Review ${report.allIssues.length} Issues`}
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-zinc-100">
          <div
            className={`h-full rounded-full transition-all ${
              report.status === "ready"
                ? "bg-emerald-500"
                : report.status === "needs_review"
                  ? "bg-amber-500"
                  : "bg-rose-500"
            }`}
            style={{
              width: `${Math.max(
                0,
                Math.min(100, report.score)
              )}%`,
            }}
          />
        </div>
      </div>

      {expanded && report.allIssues.length > 0 && (
        <div className="border-t border-black/5 bg-zinc-50 p-5 sm:p-6">
          {report.criticalIssues.length > 0 && (
            <section>
              <h4 className="text-base font-black text-zinc-950">
                Critical issues
              </h4>

              <p className="mt-1 text-sm text-zinc-500">
                These issues should be resolved before production
                use.
              </p>

              <div className="mt-3 space-y-3">
                {report.criticalIssues.map((issue) => (
                  <QualityIssueCard
                    key={issue.id}
                    issue={issue}
                  />
                ))}
              </div>
            </section>
          )}

          {report.warnings.length > 0 && (
            <section
              className={
                report.criticalIssues.length > 0
                  ? "mt-6"
                  : ""
              }
            >
              <h4 className="text-base font-black text-zinc-950">
                Recommended improvements
              </h4>

              <p className="mt-1 text-sm text-zinc-500">
                These items improve guest experience and AI
                answer quality.
              </p>

              <div className="mt-3 space-y-3">
                {report.warnings.map((issue) => (
                  <QualityIssueCard
                    key={issue.id}
                    issue={issue}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </article>
  );
}

export default function ReleaseQaPage() {
  const [qaState, setQaState] =
    useState<QaStateMap>(createInitialState);

  const [
    hasLoadedFromStorage,
    setHasLoadedFromStorage,
  ] = useState(false);

  const [qualityReports, setQualityReports] = useState<
    PropertyQualityReport[]
  >([]);

  const [qualityLoading, setQualityLoading] =
    useState(true);

  const [qualityError, setQualityError] =
    useState("");

  useEffect(() => {
    loadPropertyQualityReports();
  }, []);

  useEffect(() => {
    try {
      const rawValue = window.localStorage.getItem(
        RELEASE_QA_STORAGE_KEY
      );

      if (!rawValue) {
        setHasLoadedFromStorage(true);
        return;
      }

      const parsedValue = JSON.parse(rawValue) as Record<
        string,
        {
          status?: string;
          priority?: string;
          notes?: string;
        }
      >;

      const baseline = createInitialState();

      const mergedState =
        scenarios.reduce<QaStateMap>(
          (accumulator, scenario) => {
            const storedScenario =
              parsedValue?.[scenario.id] || {};

            accumulator[scenario.id] = {
              status: normalizeStatus(
                storedScenario.status || "not_tested"
              ),
              priority: normalizePriority(
                storedScenario.priority || "medium"
              ),
              notes:
                typeof storedScenario.notes === "string"
                  ? storedScenario.notes
                  : "",
            };

            return accumulator;
          },
          baseline
        );

      setQaState(mergedState);
    } catch {
      setQaState(createInitialState());
    } finally {
      setHasLoadedFromStorage(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedFromStorage) {
      return;
    }

    window.localStorage.setItem(
      RELEASE_QA_STORAGE_KEY,
      JSON.stringify(qaState)
    );
  }, [qaState, hasLoadedFromStorage]);

  async function loadPropertyQualityReports() {
    try {
      setQualityLoading(true);
      setQualityError("");

      const propertiesResponse = await fetch(
        "/api/properties",
        {
          cache: "no-store",
        }
      );

      const propertiesData =
        await propertiesResponse.json();

      if (!propertiesData.success) {
        throw new Error(
          propertiesData.error ||
            "Unable to load properties"
        );
      }

      const properties =
        (propertiesData.properties || []) as Property[];

      const reports = await Promise.all(
        properties.map(async (property) => {
          const identifier =
            getPropertyIdentifier(property);

          if (!identifier) {
            return buildPropertyQualityReport({
              property,
              knowledgeBase:
                mergeKnowledgeBase(property),
            });
          }

          try {
            const response = await fetch(
              `/api/properties/${encodeURIComponent(
                identifier
              )}`,
              {
                cache: "no-store",
              }
            );

            const data = await response.json();

            if (!data.success || !data.property) {
              throw new Error(
                data.error ||
                  "Unable to load property details"
              );
            }

            const fullProperty =
              data.property as Property;

            return buildPropertyQualityReport({
              property: fullProperty,
              knowledgeBase:
                mergeKnowledgeBase(fullProperty),
            });
          } catch (propertyError) {
            console.error(
              "PROPERTY QUALITY LOAD ERROR:",
              identifier,
              propertyError
            );

            return buildPropertyQualityReport({
              property,
              knowledgeBase:
                mergeKnowledgeBase(property),
            });
          }
        })
      );

      setQualityReports(
        reports.sort((a, b) => {
          const order: Record<
            PropertyQualityStatus,
            number
          > = {
            blocked: 0,
            needs_review: 1,
            ready: 2,
          };

          const statusDifference =
            order[a.status] - order[b.status];

          if (statusDifference !== 0) {
            return statusDifference;
          }

          return a.propertyName.localeCompare(
            b.propertyName
          );
        })
      );
    } catch (error) {
      console.error(
        "PROPERTY QUALITY CHECK ERROR:",
        error
      );

      setQualityError(
        error instanceof Error
          ? error.message
          : "Unable to run Property Quality Check"
      );

      setQualityReports([]);
    } finally {
      setQualityLoading(false);
    }
  }
    const qualitySummary = useMemo(() => {
    const ready = qualityReports.filter(
      (report) => report.status === "ready"
    ).length;

    const needsReview = qualityReports.filter(
      (report) => report.status === "needs_review"
    ).length;

    const blocked = qualityReports.filter(
      (report) => report.status === "blocked"
    ).length;

    const criticalIssues = qualityReports.reduce(
      (total, report) =>
        total + report.criticalIssues.length,
      0
    );

    const warnings = qualityReports.reduce(
      (total, report) =>
        total + report.warnings.length,
      0
    );

    const averageScore =
      qualityReports.length > 0
        ? Math.round(
            qualityReports.reduce(
              (total, report) =>
                total + report.score,
              0
            ) / qualityReports.length
          )
        : 0;

    return {
      total: qualityReports.length,
      ready,
      needsReview,
      blocked,
      criticalIssues,
      warnings,
      averageScore,
    };
  }, [qualityReports]);

  const qaSummary = useMemo(() => {
    const values = scenarios.map(
      (scenario) => qaState[scenario.id]
    );

    const passed = values.filter(
      (value) => value?.status === "passed"
    ).length;

    const failed = values.filter(
      (value) => value?.status === "failed"
    ).length;

    const notTested = values.filter(
      (value) => value?.status === "not_tested"
    ).length;

    const total = values.length;

    const completionPercent =
      total > 0
        ? Math.round(
            ((passed + failed) / total) * 100
          )
        : 0;

    return {
      passed,
      failed,
      notTested,
      total,
      completionPercent,
    };
  }, [qaState]);

  const globalReleaseStatus = useMemo(() => {
    if (qualitySummary.blocked > 0) {
      return {
        label: "Release Blocked",
        description:
          "At least one property has critical content or configuration issues.",
        className:
          "border-rose-200 bg-rose-50 text-rose-800",
        icon: "⛔",
      };
    }

    if (qualitySummary.needsReview > 0) {
      return {
        label: "Needs Review",
        description:
          "No critical blockers were found, but some properties still have recommended improvements.",
        className:
          "border-amber-200 bg-amber-50 text-amber-800",
        icon: "⚠️",
      };
    }

    if (
      qualitySummary.total > 0 &&
      qualitySummary.ready ===
        qualitySummary.total
    ) {
      return {
        label: "Ready for Production",
        description:
          "All accessible properties passed the automatic quality checks.",
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-800",
        icon: "✅",
      };
    }

    return {
      label: "Not Checked",
      description:
        "Run the automatic property quality check before release.",
      className:
        "border-zinc-200 bg-zinc-100 text-zinc-700",
      icon: "🧪",
    };
  }, [qualitySummary]);

  function updateScenario(
    scenarioId: string,
    patch: Partial<QaScenarioState>
  ) {
    setQaState((current) => ({
      ...current,
      [scenarioId]: {
        ...current[scenarioId],
        ...patch,
      },
    }));
  }

  function resetChecklist() {
    const confirmReset = window.confirm(
      "Reset all Release QA statuses and notes?"
    );

    if (!confirmReset) {
      return;
    }

    setQaState(createInitialState());
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6f1e8] to-[#f0e9dd]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24 space-y-7">
        <section className="bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white rounded-[32px] p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
            <div>
              <div className="uppercase tracking-[0.3em] text-xs text-white/50 mb-3">
                RELEASE CANDIDATE
              </div>

              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
                Property Quality & Release QA
              </h1>

              <p className="text-white/70 text-sm md:text-base leading-relaxed max-w-3xl">
                Run automatic quality checks across all accessible
                properties, review critical content problems and
                complete the manual release checklist before
                production deployment.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/dashboard"
                className="inline-flex rounded-xl bg-white text-black px-4 py-2 text-sm font-semibold hover:opacity-90 transition"
              >
                Back to Dashboard
              </a>

              <button
                type="button"
                onClick={loadPropertyQualityReports}
                disabled={qualityLoading}
                className="inline-flex rounded-xl bg-white/10 border border-white/20 text-white px-4 py-2 text-sm font-semibold hover:bg-white/20 transition disabled:opacity-50"
              >
                {qualityLoading
                  ? "Checking..."
                  : "Run Quality Check"}
              </button>

              <button
                type="button"
                onClick={resetChecklist}
                className="inline-flex rounded-xl bg-white/10 border border-white/20 text-white px-4 py-2 text-sm font-semibold hover:bg-white/20 transition"
              >
                Reset Manual QA
              </button>
            </div>
          </div>
        </section>

        <section
          className={`rounded-[28px] border p-5 sm:p-6 ${globalReleaseStatus.className}`}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="text-3xl" aria-hidden="true">
                {globalReleaseStatus.icon}
              </div>

              <div>
                <h2 className="text-2xl font-black">
                  {globalReleaseStatus.label}
                </h2>

                <p className="mt-1 text-sm leading-relaxed opacity-80">
                  {globalReleaseStatus.description}
                </p>
              </div>
            </div>

            <div className="text-sm font-black">
              Average quality:{" "}
              {qualitySummary.averageScore}%
            </div>
          </div>
        </section>

        {qualityError && (
          <section className="rounded-[24px] border border-rose-100 bg-rose-50 p-5 font-semibold text-rose-700">
            {qualityError}
          </section>
        )}

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          <div className="rounded-[22px] border border-black/5 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-2">
              Properties
            </div>

            <div className="text-3xl font-black text-gray-950">
              {qualitySummary.total}
            </div>
          </div>

          <div className="rounded-[22px] border border-black/5 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-2">
              Ready
            </div>

            <div className="text-3xl font-black text-emerald-700">
              {qualitySummary.ready}
            </div>
          </div>

          <div className="rounded-[22px] border border-black/5 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-2">
              Review
            </div>

            <div className="text-3xl font-black text-amber-700">
              {qualitySummary.needsReview}
            </div>
          </div>

          <div className="rounded-[22px] border border-black/5 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-2">
              Blocked
            </div>

            <div className="text-3xl font-black text-rose-700">
              {qualitySummary.blocked}
            </div>
          </div>

          <div className="rounded-[22px] border border-black/5 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-2">
              Critical
            </div>

            <div className="text-3xl font-black text-rose-700">
              {qualitySummary.criticalIssues}
            </div>
          </div>

          <div className="rounded-[22px] border border-black/5 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-2">
              Warnings
            </div>

            <div className="text-3xl font-black text-amber-700">
              {qualitySummary.warnings}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                Automatic audit
              </div>

              <h2 className="mt-2 text-2xl font-black text-zinc-950 sm:text-3xl">
                Property Quality Checker
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-500">
                Checks guest-facing content, essential access
                information, Wi-Fi, check-in, check-out, lockbox
                instructions, emergency contacts, placeholders and
                conflicting key-return guidance.
              </p>
            </div>

            <button
              type="button"
              onClick={loadPropertyQualityReports}
              disabled={qualityLoading}
              className="rounded-2xl bg-black px-5 py-3 font-black text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {qualityLoading
                ? "Running checks..."
                : "Refresh Results"}
            </button>
          </div>
        </section>

        {qualityLoading ? (
          <section className="rounded-[28px] border border-black/5 bg-white p-10 text-center shadow-sm">
            <div className="text-4xl">🔍</div>

            <h2 className="mt-4 text-2xl font-black text-zinc-950">
              Checking property content
            </h2>

            <p className="mt-2 text-zinc-500">
              Loading each accessible property and validating its
              guest-facing information.
            </p>
          </section>
        ) : qualityReports.length === 0 ? (
          <section className="rounded-[28px] border border-black/5 bg-white p-10 text-center shadow-sm">
            <div className="text-4xl">🏠</div>

            <h2 className="mt-4 text-2xl font-black text-zinc-950">
              No properties available
            </h2>

            <p className="mt-2 text-zinc-500">
              Add or assign at least one property before running
              the quality checker.
            </p>
          </section>
        ) : (
          <section className="space-y-4">
            {qualityReports.map((report) => (
              <PropertyQualityCard
                key={
                  report.propertyIdentifier ||
                  report.propertyId
                }
                report={report}
              />
            ))}
          </section>
        )}

        <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                Manual validation
              </div>

              <h2 className="mt-2 text-2xl font-black text-zinc-950 sm:text-3xl">
                Release QA Test Plan
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-500">
                Complete the operational scenarios that cannot be
                validated from stored property content alone.
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-black text-zinc-700">
              {qaSummary.completionPercent}% completed
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-[20px] p-4 border border-black/5 shadow-sm">
            <div className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-2">
              Total
            </div>

            <div className="text-3xl font-black text-gray-950">
              {qaSummary.total}
            </div>
          </div>

          <div className="bg-white rounded-[20px] p-4 border border-black/5 shadow-sm">
            <div className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-2">
              Passed
            </div>

            <div className="text-3xl font-black text-emerald-700">
              {qaSummary.passed}
            </div>
          </div>

          <div className="bg-white rounded-[20px] p-4 border border-black/5 shadow-sm">
            <div className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-2">
              Failed
            </div>

            <div className="text-3xl font-black text-red-700">
              {qaSummary.failed}
            </div>
          </div>

          <div className="bg-white rounded-[20px] p-4 border border-black/5 shadow-sm">
            <div className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-2">
              Completed
            </div>

            <div className="text-3xl font-black text-gray-950">
              {qaSummary.completionPercent}%
            </div>
          </div>
        </section>

        <section className="bg-white rounded-[24px] p-5 sm:p-6 border border-black/5 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-black text-gray-950 mb-3">
            Manual QA Guidance
          </h2>

          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="rounded-2xl bg-[#f7f6f2] border border-black/5 p-4">
              <div className="font-semibold text-gray-900 mb-1">
                How to execute
              </div>

              <p>
                Validate each scenario manually in dashboard and
                guest flows. Mark the result, assign priority and
                record concise reproduction steps for failures.
              </p>
            </div>

            <div className="rounded-2xl bg-[#f7f6f2] border border-black/5 p-4">
              <div className="font-semibold text-gray-900 mb-1">
                Reporting format
              </div>

              <p>
                For failures, include route, test step, observed
                behavior, expected behavior and blocker level.
              </p>
            </div>
          </div>
        </section>

        {qaSummary.notTested === qaSummary.total && (
          <section className="bg-white rounded-[24px] p-5 sm:p-6 border border-black/5 shadow-sm text-center">
            <div className="text-4xl mb-3">🧪</div>

            <h2 className="text-2xl font-black text-gray-950 mb-2">
              No scenarios tested yet
            </h2>

            <p className="text-gray-600 max-w-2xl mx-auto">
              Start with Property Save / Load, Guest Page Opening,
              AI Chat and Guest Access lifecycle.
            </p>
          </section>
        )}

        <section className="space-y-4">
          {scenarios.map((scenario) => {
            const scenarioState =
              qaState[scenario.id] || {
                status: "not_tested",
                priority: "medium",
                notes: "",
              };

            return (
              <article
                key={scenario.id}
                className="bg-white rounded-[24px] border border-black/5 p-5 sm:p-6 shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl font-black text-gray-950 mb-2">
                      {scenario.title}
                    </h3>

                    <p className="text-sm text-gray-600 leading-relaxed">
                      {scenario.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex border rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                        scenarioState.status
                      )}`}
                    >
                      {getStatusLabel(
                        scenarioState.status
                      )}
                    </span>

                    <span
                      className={`inline-flex border rounded-full px-3 py-1 text-xs font-semibold uppercase ${getPriorityBadgeClass(
                        scenarioState.priority
                      )}`}
                    >
                      {scenarioState.priority}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <label className="text-sm">
                    <span className="block font-semibold text-gray-900 mb-2">
                      Status
                    </span>

                    <select
                      value={scenarioState.status}
                      onChange={(event) =>
                        updateScenario(scenario.id, {
                          status: normalizeStatus(
                            event.target.value
                          ),
                        })
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/20"
                    >
                      <option value="not_tested">
                        Not tested
                      </option>

                      <option value="passed">
                        Passed
                      </option>

                      <option value="failed">
                        Failed
                      </option>
                    </select>
                  </label>

                  <label className="text-sm">
                    <span className="block font-semibold text-gray-900 mb-2">
                      Priority
                    </span>

                    <select
                      value={scenarioState.priority}
                      onChange={(event) =>
                        updateScenario(scenario.id, {
                          priority: normalizePriority(
                            event.target.value
                          ),
                        })
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/20"
                    >
                      <option value="high">
                        High
                      </option>

                      <option value="medium">
                        Medium
                      </option>

                      <option value="low">
                        Low
                      </option>
                    </select>
                  </label>
                </div>

                <label className="text-sm block">
                  <span className="block font-semibold text-gray-900 mb-2">
                    Notes
                  </span>

                  <textarea
                    value={scenarioState.notes}
                    onChange={(event) =>
                      updateScenario(scenario.id, {
                        notes: event.target.value,
                      })
                    }
                    placeholder="Write test observations, failed step details and follow-up actions..."
                    className="w-full min-h-[120px] bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                </label>
              </article>
            );
          })}
        </section>

        {qaSummary.failed === 0 &&
          qaSummary.notTested < qaSummary.total && (
            <section className="bg-emerald-50 border border-emerald-100 rounded-[24px] p-5 sm:p-6">
              <h2 className="text-xl font-black text-emerald-800 mb-2">
                No failed scenarios currently recorded
              </h2>

              <p className="text-emerald-700 text-sm leading-relaxed">
                Continue full path validation and edge-case checks
                before release sign-off.
              </p>
            </section>
          )}
      </div>
    </div>
  );
}