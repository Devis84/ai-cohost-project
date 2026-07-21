"use client";

import type {
  SaveValidationIssue,
  SaveValidationResult,
  SaveValidationTab,
} from "../_lib/dashboard-save-validation";

type DashboardSaveReadinessModalProps = {
  open: boolean;
  propertyName: string;
  validation: SaveValidationResult;
  saving: boolean;
  onClose: () => void;
  onSaveAnyway: () => void;
  onOpenTab: (tab: SaveValidationTab) => void;
};

function IssueCard({
  issue,
  onOpen,
}: {
  issue: SaveValidationIssue;
  onOpen: () => void;
}) {
  const isCritical = issue.severity === "critical";

  return (
    <article
      className={`rounded-3xl border p-4 ${
        isCritical
          ? "border-rose-100 bg-rose-50"
          : "border-amber-100 bg-amber-50"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-lg ${
                isCritical
                  ? "bg-rose-100 text-rose-700"
                  : "bg-amber-100 text-amber-700"
              }`}
              aria-hidden="true"
            >
              {isCritical ? "!" : "i"}
            </div>

            <div>
              <div
                className={`font-black ${
                  isCritical
                    ? "text-rose-950"
                    : "text-amber-950"
                }`}
              >
                {issue.label}
              </div>

              <p
                className={`mt-1 text-sm leading-relaxed ${
                  isCritical
                    ? "text-rose-800/75"
                    : "text-amber-800/75"
                }`}
              >
                {issue.description}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className={`shrink-0 rounded-2xl border px-4 py-2.5 text-sm font-black transition ${
            isCritical
              ? "border-rose-200 bg-white text-rose-800 hover:bg-rose-100"
              : "border-amber-200 bg-white text-amber-800 hover:bg-amber-100"
          }`}
        >
          Fix now
        </button>
      </div>
    </article>
  );
}

function SummaryBadge({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "critical" | "recommended";
}) {
  const isCritical = tone === "critical";

  return (
    <div
      className={`rounded-3xl border p-4 ${
        isCritical
          ? "border-rose-100 bg-rose-50"
          : "border-amber-100 bg-amber-50"
      }`}
    >
      <div
        className={`text-3xl font-black ${
          isCritical
            ? "text-rose-700"
            : "text-amber-700"
        }`}
      >
        {value}
      </div>

      <div
        className={`mt-1 text-sm font-bold ${
          isCritical
            ? "text-rose-900"
            : "text-amber-900"
        }`}
      >
        {label}
      </div>
    </div>
  );
}

export function DashboardSaveReadinessModal({
  open,
  propertyName,
  validation,
  saving,
  onClose,
  onSaveAnyway,
  onOpenTab,
}: DashboardSaveReadinessModalProps) {
  if (!open) {
    return null;
  }

  const criticalCount =
    validation.criticalIssues.length;

  const recommendedCount =
    validation.recommendedIssues.length;

  function handleOpenIssue(issue: SaveValidationIssue) {
    onClose();
    onOpenTab(issue.tab);

    window.setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 50);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-readiness-title"
    >
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[32px] bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-[36px]">
        <header className="border-b border-black/5 px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex items-start justify-between gap-5">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.25em] text-zinc-400">
                Property readiness check
              </div>

              <h2
                id="save-readiness-title"
                className="mt-2 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl"
              >
                Review before saving
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                {propertyName || "This property"} has
                information that may need attention before it
                is used by guests and the AI Concierge.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Close readiness review"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xl font-bold text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-40"
            >
              ×
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <SummaryBadge
              value={criticalCount}
              label={
                criticalCount === 1
                  ? "Critical issue"
                  : "Critical issues"
              }
              tone="critical"
            />

            <SummaryBadge
              value={recommendedCount}
              label={
                recommendedCount === 1
                  ? "Recommended item"
                  : "Recommended items"
              }
              tone="recommended"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          {criticalCount > 0 && (
            <section>
              <div className="mb-3">
                <h3 className="text-lg font-black text-zinc-950">
                  Essential guest information
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  These items may cause incorrect instructions,
                  access problems or poor guest support.
                </p>
              </div>

              <div className="space-y-3">
                {validation.criticalIssues.map(
                  (issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      onOpen={() =>
                        handleOpenIssue(issue)
                      }
                    />
                  )
                )}
              </div>
            </section>
          )}

          {recommendedCount > 0 && (
            <section
              className={
                criticalCount > 0 ? "mt-7" : ""
              }
            >
              <div className="mb-3">
                <h3 className="text-lg font-black text-zinc-950">
                  Recommended improvements
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  Saving is possible, but completing these items
                  will improve the Guest Page and AI replies.
                </p>
              </div>

              <div className="space-y-3">
                {validation.recommendedIssues.map(
                  (issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      onOpen={() =>
                        handleOpenIssue(issue)
                      }
                    />
                  )
                )}
              </div>
            </section>
          )}

          <div className="mt-7 rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="font-black text-zinc-950">
              Saving with missing information
            </div>

            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              You can save anyway. The current information will
              be stored, but guests or the AI may receive
              incomplete or inconsistent instructions. Critical
              issues should normally be corrected first.
            </p>
          </div>
        </div>

        <footer className="border-t border-black/5 bg-white px-5 py-4 sm:px-7 sm:py-5">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 font-black text-zinc-950 transition hover:bg-zinc-100 disabled:opacity-40"
            >
              Go back and complete
            </button>

            <button
              type="button"
              onClick={onSaveAnyway}
              disabled={saving}
              className="rounded-2xl bg-black px-6 py-3.5 font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save anyway"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}