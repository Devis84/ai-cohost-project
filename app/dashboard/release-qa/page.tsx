"use client";

import { useEffect, useMemo, useState } from "react";

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

const RELEASE_QA_STORAGE_KEY = "ai_cohost_release_qa_checklist_v1";

const scenarios: QaScenario[] = [
  {
    id: "property_creation",
    title: "Property Creation",
    description:
      "Create a new property from dashboard setup and verify it appears in property selector.",
  },
  {
    id: "property_save_load",
    title: "Property Save / Load",
    description:
      "Save property details and knowledge sections, then reload and confirm data persists correctly.",
  },
  {
    id: "guest_page_opening",
    title: "Guest Page Opening",
    description:
      "Open public guest page from generated URL and verify content sections render without errors.",
  },
  {
    id: "qr_guest_url",
    title: "QR / Guest URL",
    description:
      "Open QR tools and verify QR links resolve to the expected guest destination.",
  },
  {
    id: "ai_chat",
    title: "AI Chat",
    description:
      "Send guest-style prompts and verify replies return, conversation preview updates, and no blocking regression occurs.",
  },
  {
    id: "expired_stay_lifecycle",
    title: "Expired Stay Lifecycle",
    description:
      "Validate not active, active, and expired stay access behavior in guest/stay flows.",
  },
  {
    id: "booking_management",
    title: "Booking Management",
    description:
      "Review booking tabs, filtering, and booking action links from the dashboard bookings page.",
  },
  {
    id: "cleaning_workflow",
    title: "Cleaning Workflow",
    description:
      "Verify cleaning tasks list, task status transitions, and cleaner-facing flow behavior.",
  },
  {
    id: "conversations",
    title: "Conversations",
    description:
      "Check conversation list filters, selected thread view, and mark-read flow behavior.",
  },
  {
    id: "analytics",
    title: "Analytics",
    description:
      "Validate analytics cards, breakdown sections, and empty-state behavior for low-data properties.",
  },
  {
    id: "channel_manager_sync",
    title: "Channel Manager / Calendar Sync",
    description:
      "Test calendar source create/delete/sync UI flow and verify sync log updates and statuses.",
  },
  {
    id: "italian_compliance_optional",
    title: "Italian Compliance Optional Module",
    description:
      "Verify module behavior across no-property, non-Italy, disabled, and enabled states.",
  },
  {
    id: "ai_auto_populate",
    title: "AI Auto Populate",
    description:
      "Run Smart Setup Assistant draft generation, preview, and apply-to-form workflow.",
  },
  {
    id: "partner_access",
    title: "Partner Access",
    description:
      "Validate role-limited account visibility and restrictions for partner/view-only access.",
  },
];

function createInitialState(): QaStateMap {
  return scenarios.reduce<QaStateMap>((accumulator, scenario) => {
    accumulator[scenario.id] = {
      status: "not_tested",
      priority: "medium",
      notes: "",
    };

    return accumulator;
  }, {});
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

export default function ReleaseQaPage() {
  const [qaState, setQaState] = useState<QaStateMap>(createInitialState);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  useEffect(() => {
    try {
      const rawValue = window.localStorage.getItem(RELEASE_QA_STORAGE_KEY);

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

      const mergedState = scenarios.reduce<QaStateMap>((accumulator, scenario) => {
        const storedScenario = parsedValue?.[scenario.id] || {};

        accumulator[scenario.id] = {
          status: normalizeStatus(storedScenario.status || "not_tested"),
          priority: normalizePriority(storedScenario.priority || "medium"),
          notes: typeof storedScenario.notes === "string" ? storedScenario.notes : "",
        };

        return accumulator;
      }, baseline);

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

    window.localStorage.setItem(RELEASE_QA_STORAGE_KEY, JSON.stringify(qaState));
  }, [qaState, hasLoadedFromStorage]);

  const summary = useMemo(() => {
    const values = scenarios.map((scenario) => qaState[scenario.id]);

    const passed = values.filter((value) => value?.status === "passed").length;
    const failed = values.filter((value) => value?.status === "failed").length;
    const notTested = values.filter((value) => value?.status === "not_tested").length;
    const total = values.length;
    const completionPercent = total > 0 ? Math.round(((passed + failed) / total) * 100) : 0;

    return {
      passed,
      failed,
      notTested,
      total,
      completionPercent,
    };
  }, [qaState]);

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
                Release QA Test Plan
              </h1>
              <p className="text-white/70 text-sm md:text-base leading-relaxed max-w-3xl">
                Internal manual QA checklist for core dashboard and guest flows.
                Update status, priority and notes during validation. This checklist
                is internal-only and does not affect production behavior.
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
                onClick={resetChecklist}
                className="inline-flex rounded-xl bg-white/10 border border-white/20 text-white px-4 py-2 text-sm font-semibold hover:bg-white/20 transition"
              >
                Reset Checklist
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-[20px] p-4 border border-black/5 shadow-sm">
            <div className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-2">Total</div>
            <div className="text-3xl font-black text-gray-950">{summary.total}</div>
          </div>
          <div className="bg-white rounded-[20px] p-4 border border-black/5 shadow-sm">
            <div className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-2">Passed</div>
            <div className="text-3xl font-black text-emerald-700">{summary.passed}</div>
          </div>
          <div className="bg-white rounded-[20px] p-4 border border-black/5 shadow-sm">
            <div className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-2">Failed</div>
            <div className="text-3xl font-black text-red-700">{summary.failed}</div>
          </div>
          <div className="bg-white rounded-[20px] p-4 border border-black/5 shadow-sm">
            <div className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-2">Completed</div>
            <div className="text-3xl font-black text-gray-950">{summary.completionPercent}%</div>
          </div>
        </section>

        <section className="bg-white rounded-[24px] p-5 sm:p-6 border border-black/5 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-black text-gray-950 mb-3">Manual QA Guidance</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="rounded-2xl bg-[#f7f6f2] border border-black/5 p-4">
              <div className="font-semibold text-gray-900 mb-1">How to execute</div>
              <p>
                Validate each scenario manually in dashboard flows. Mark status, assign priority,
                and leave concise notes with reproducible steps for failed cases.
              </p>
            </div>
            <div className="rounded-2xl bg-[#f7f6f2] border border-black/5 p-4">
              <div className="font-semibold text-gray-900 mb-1">Reporting format</div>
              <p>
                For failures, include page route, scenario step, observed behavior, expected behavior,
                and blocker level to speed triage before release candidate sign-off.
              </p>
            </div>
          </div>
        </section>

        {summary.notTested === summary.total && (
          <section className="bg-white rounded-[24px] p-5 sm:p-6 border border-black/5 shadow-sm text-center">
            <div className="text-4xl mb-3">🧪</div>
            <h2 className="text-2xl font-black text-gray-950 mb-2">No scenarios tested yet</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Start with high-priority flows first: Property Save / Load, Guest Page Opening,
              AI Chat, and Channel Manager / Calendar Sync.
            </p>
          </section>
        )}

        <section className="space-y-4">
          {scenarios.map((scenario) => {
            const scenarioState = qaState[scenario.id] || {
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
                    <h3 className="text-xl font-black text-gray-950 mb-2">{scenario.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{scenario.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex border rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                        scenarioState.status
                      )}`}
                    >
                      {getStatusLabel(scenarioState.status)}
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
                    <span className="block font-semibold text-gray-900 mb-2">Status</span>
                    <select
                      value={scenarioState.status}
                      onChange={(event) =>
                        updateScenario(scenario.id, {
                          status: normalizeStatus(event.target.value),
                        })
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/20"
                    >
                      <option value="not_tested">Not tested</option>
                      <option value="passed">Passed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </label>

                  <label className="text-sm">
                    <span className="block font-semibold text-gray-900 mb-2">Priority</span>
                    <select
                      value={scenarioState.priority}
                      onChange={(event) =>
                        updateScenario(scenario.id, {
                          priority: normalizePriority(event.target.value),
                        })
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/20"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </label>
                </div>

                <label className="text-sm block">
                  <span className="block font-semibold text-gray-900 mb-2">Notes</span>
                  <textarea
                    value={scenarioState.notes}
                    onChange={(event) =>
                      updateScenario(scenario.id, {
                        notes: event.target.value,
                      })
                    }
                    placeholder="Write manual test observations, failed step details, and follow-up actions..."
                    className="w-full min-h-[120px] bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                </label>
              </article>
            );
          })}
        </section>

        {summary.failed === 0 && summary.notTested < summary.total && (
          <section className="bg-emerald-50 border border-emerald-100 rounded-[24px] p-5 sm:p-6">
            <h2 className="text-xl font-black text-emerald-800 mb-2">No failed scenarios currently recorded</h2>
            <p className="text-emerald-700 text-sm leading-relaxed">
              Continue full path validation and edge-case checks before release candidate sign-off.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
