 "use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

type IssueFilter =
  | "open"
  | "high"
  | "medium"
  | "resolved"
  | "all"

type Issue = {
  id: string
  property_id?: string
  property_name?: string
  property_city?: string
  conversation_id?: string
  guest_name?: string
  issue_type?: string
  priority?: string
  severity?: string
  status?: string
  message?: string
  description?: string
  created_at?: string
}

function formatLabel(value?: string) {
  if (!value) return "Guest issue"

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatDate(value?: string) {
  if (!value) return ""

  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

function getPriority(issue: Issue) {
  return issue.priority || issue.severity || "normal"
}

function getStatus(issue: Issue) {
  return issue.status?.toLowerCase() || "open"
}

function isResolved(issue: Issue) {
  const status = getStatus(issue)

  return status === "resolved" || status === "closed"
}

function isHighPriority(issue: Issue) {
  const priority = getPriority(issue).toLowerCase()

  return priority === "high" || priority === "urgent"
}

function isMediumPriority(issue: Issue) {
  const priority = getPriority(issue).toLowerCase()

  return priority === "medium"
}

function getPriorityClass(priority: string) {
  const normalized = priority.toLowerCase()

  if (normalized === "high" || normalized === "urgent") {
    return "bg-red-50 text-red-700 border-red-100"
  }

  if (normalized === "medium") {
    return "bg-orange-50 text-orange-700 border-orange-100"
  }

  return "bg-gray-100 text-gray-600 border-gray-100"
}

function getStatusClass(status: string) {
  const normalized = status.toLowerCase()

  if (normalized === "resolved" || normalized === "closed") {
    return "bg-emerald-50 text-emerald-700 border-emerald-100"
  }

  if (normalized === "in_progress") {
    return "bg-blue-50 text-blue-700 border-blue-100"
  }

  return "bg-gray-100 text-gray-700 border-gray-100"
}

function getIssueTone(issue: Issue) {
  const type = issue.issue_type?.toLowerCase() || ""
  const description = `${issue.description || ""} ${
    issue.message || ""
  }`.toLowerCase()

  const combined = `${type} ${description}`

  if (
    combined.includes("emergency") ||
    combined.includes("safety") ||
    combined.includes("danger")
  ) {
    return {
      icon: "🚨",
      label: "Emergency / Safety",
    }
  }

  if (
    combined.includes("lockbox") ||
    combined.includes("access") ||
    combined.includes("code") ||
    combined.includes("check-in") ||
    combined.includes("checkin")
  ) {
    return {
      icon: "🔑",
      label: "Access / Check-in",
    }
  }

  if (
    combined.includes("wifi") ||
    combined.includes("internet")
  ) {
    return {
      icon: "📶",
      label: "WiFi / Internet",
    }
  }

  if (
    combined.includes("clean") ||
    combined.includes("dirty") ||
    combined.includes("towel") ||
    combined.includes("linen")
  ) {
    return {
      icon: "🧹",
      label: "Cleaning",
    }
  }

  if (
    combined.includes("maintenance") ||
    combined.includes("broken") ||
    combined.includes("repair") ||
    combined.includes("water") ||
    combined.includes("ac")
  ) {
    return {
      icon: "🛠️",
      label: "Maintenance",
    }
  }

  if (
    combined.includes("complaint") ||
    combined.includes("refund") ||
    combined.includes("unhappy")
  ) {
    return {
      icon: "⚠️",
      label: "Complaint",
    }
  }

  return {
    icon: "💬",
    label: "Guest Support",
  }
}

function FilterButton({
  label,
  value,
  activeFilter,
  count,
  onClick,
}: {
  label: string
  value: IssueFilter
  activeFilter: IssueFilter
  count: number
  onClick: (value: IssueFilter) => void
}) {
  const active = value === activeFilter

  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
        active
          ? "bg-black text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {label}
      <span
        className={`ml-2 ${
          active ? "text-white/60" : "text-gray-400"
        }`}
      >
        {count}
      </span>
    </button>
  )
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [resolvingId, setResolvingId] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [search, setSearch] = useState("")
  const [filter, setFilter] =
    useState<IssueFilter>("open")

  async function loadIssues() {
    try {
      setLoading(true)
      setErrorMessage("")

      const response = await fetch("/api/issues")
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to load issues"
        )
      }

      setIssues(data.issues || [])
    } catch (error) {
      console.error("LOAD ISSUES ERROR:", error)
      setErrorMessage(
        "Unable to load issues at the moment."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIssues()
  }, [])

  const openIssues = useMemo(() => {
    return issues.filter((issue) => !isResolved(issue))
  }, [issues])

  const resolvedIssues = useMemo(() => {
    return issues.filter((issue) => isResolved(issue))
  }, [issues])

  const highPriorityIssues = useMemo(() => {
    return openIssues.filter((issue) => isHighPriority(issue))
  }, [openIssues])

  const mediumPriorityIssues = useMemo(() => {
    return openIssues.filter((issue) => isMediumPriority(issue))
  }, [openIssues])

  const filteredIssues = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return issues.filter((issue) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "open" && !isResolved(issue)) ||
        (filter === "resolved" && isResolved(issue)) ||
        (filter === "high" &&
          !isResolved(issue) &&
          isHighPriority(issue)) ||
        (filter === "medium" &&
          !isResolved(issue) &&
          isMediumPriority(issue))

      if (!matchesFilter) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const searchableText = [
        issue.property_name,
        issue.property_city,
        issue.guest_name,
        issue.issue_type,
        issue.priority,
        issue.severity,
        issue.status,
        issue.message,
        issue.description,
        issue.conversation_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return searchableText.includes(normalizedSearch)
    })
  }, [issues, filter, search])

  async function resolveIssue(issueId: string) {
    try {
      setResolvingId(issueId)

      const response = await fetch("/api/issues/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          issueId,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to resolve issue"
        )
      }

      await loadIssues()
    } catch (error) {
      console.error("RESOLVE ISSUE ERROR:", error)
      alert("Unable to resolve this issue")
    } finally {
      setResolvingId("")
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <div className="sticky top-0 z-40 backdrop-blur-2xl bg-white/80 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <div className="uppercase tracking-[0.25em] text-[11px] text-gray-400 font-semibold mb-2">
              HOST OPERATIONS
            </div>

            <h1 className="text-3xl font-bold text-gray-900">
              Guest Problem Center
            </h1>

            <div className="text-gray-500 mt-2">
              Review guest issues, escalations, access problems and items that may require host attention.
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadIssues}
              className="bg-white border border-gray-200 text-gray-900 px-5 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition"
            >
              Refresh
            </button>

            <Link
              href="/dashboard/inbox"
              className="bg-white border border-gray-200 text-gray-900 px-5 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition"
            >
              Inbox
            </Link>

            <Link
              href="/dashboard"
              className="bg-black text-white px-6 py-4 rounded-2xl font-semibold shadow-xl hover:opacity-90 transition"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white rounded-[32px] p-7 md:p-8 shadow-2xl mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white/10 border border-white/10 rounded-3xl p-5">
              <div className="text-white/50 text-sm mb-2">
                Open Issues
              </div>

              <div className="text-4xl font-black">
                {openIssues.length}
              </div>
            </div>

            <div className="bg-white/10 border border-white/10 rounded-3xl p-5">
              <div className="text-white/50 text-sm mb-2">
                High Priority
              </div>

              <div className="text-4xl font-black">
                {highPriorityIssues.length}
              </div>
            </div>

            <div className="bg-white/10 border border-white/10 rounded-3xl p-5">
              <div className="text-white/50 text-sm mb-2">
                Medium
              </div>

              <div className="text-4xl font-black">
                {mediumPriorityIssues.length}
              </div>
            </div>

            <div className="bg-white/10 border border-white/10 rounded-3xl p-5">
              <div className="text-white/50 text-sm mb-2">
                Resolved
              </div>

              <div className="text-4xl font-black">
                {resolvedIssues.length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-gray-200 shadow-xl p-5 md:p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex-1">
              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search property, guest, issue type, message or conversation..."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <FilterButton
                label="Open"
                value="open"
                activeFilter={filter}
                count={openIssues.length}
                onClick={setFilter}
              />

              <FilterButton
                label="High"
                value="high"
                activeFilter={filter}
                count={highPriorityIssues.length}
                onClick={setFilter}
              />

              <FilterButton
                label="Medium"
                value="medium"
                activeFilter={filter}
                count={mediumPriorityIssues.length}
                onClick={setFilter}
              />

              <FilterButton
                label="Resolved"
                value="resolved"
                activeFilter={filter}
                count={resolvedIssues.length}
                onClick={setFilter}
              />

              <FilterButton
                label="All"
                value="all"
                activeFilter={filter}
                count={issues.length}
                onClick={setFilter}
              />
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8">
            <div className="text-xl font-bold text-gray-900 mb-2">
              Loading issues
            </div>
            <div className="text-gray-500">
              Please wait while we check the latest guest issues.
            </div>
          </div>
        )}

        {!loading && errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-3xl p-6 font-medium">
            {errorMessage}
          </div>
        )}

        {!loading &&
          !errorMessage &&
          filteredIssues.length === 0 && (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-10 text-center">
              <div className="text-5xl mb-5">✅</div>

              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                No issues in this view
              </h2>

              <p className="text-gray-500 max-w-xl mx-auto">
                There are no guest issues matching the selected filters.
              </p>
            </div>
          )}

        {!loading &&
          !errorMessage &&
          filteredIssues.length > 0 && (
            <div className="grid xl:grid-cols-2 gap-5">
              {filteredIssues.map((issue) => {
                const priority = getPriority(issue)
                const status = getStatus(issue)
                const issueTone = getIssueTone(issue)

                const issueTitle =
                  issue.issue_type ||
                  issue.severity ||
                  issue.priority ||
                  "Guest issue"

                const description =
                  issue.description ||
                  issue.message ||
                  "No description provided."

                const propertyName =
                  issue.property_name ||
                  (issue.property_id
                    ? `Property ${issue.property_id.slice(0, 8)}`
                    : "Unknown property")

                const propertyCity =
                  issue.property_city || ""

                return (
                  <div
                    key={issue.id}
                    className="bg-white rounded-[32px] border border-gray-200 shadow-xl p-6"
                  >
                    <div className="flex flex-col gap-5">
                      <div className="flex items-start justify-between gap-5">
                        <div>
                          <div className="text-4xl mb-3">
                            {issueTone.icon}
                          </div>

                          <div className="uppercase tracking-[0.25em] text-[10px] text-gray-400 font-semibold mb-2">
                            {issueTone.label}
                          </div>

                          <h2 className="text-2xl font-black text-gray-900 leading-tight">
                            {formatLabel(issueTitle)}
                          </h2>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`border rounded-full px-3 py-1 text-xs font-bold uppercase ${getPriorityClass(priority)}`}
                          >
                            {priority}
                          </span>

                          <span
                            className={`border rounded-full px-3 py-1 text-xs font-bold uppercase ${getStatusClass(status)}`}
                          >
                            {status}
                          </span>
                        </div>
                      </div>

                      <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5">
                        <div className="text-sm text-gray-400 mb-1">
                          Property
                        </div>

                        <div className="font-bold text-gray-900">
                          {propertyName}
                        </div>

                        {propertyCity && (
                          <div className="text-sm text-gray-500 mt-1">
                            {propertyCity}
                          </div>
                        )}

                        {issue.guest_name && (
                          <div className="text-sm text-gray-500 mt-2">
                            Guest: {issue.guest_name}
                          </div>
                        )}
                      </div>

                      {issue.conversation_id && (
                        <div className="text-xs text-gray-400 break-all">
                          Conversation: {issue.conversation_id}
                        </div>
                      )}

                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {description}
                      </p>

                      {issue.created_at && (
                        <div className="text-xs text-gray-400">
                          Created: {formatDate(issue.created_at)}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3 pt-2">
                        <Link
                          href="/dashboard/inbox"
                          className="bg-gray-100 text-black px-5 py-3 rounded-2xl text-sm font-semibold hover:bg-gray-200 transition"
                        >
                          Open Inbox
                        </Link>

                        {!isResolved(issue) && (
                          <button
                            onClick={() => resolveIssue(issue.id)}
                            disabled={resolvingId === issue.id}
                            className="bg-black text-white px-6 py-3 rounded-2xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                          >
                            {resolvingId === issue.id
                              ? "Resolving..."
                              : "Resolve"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
      </main>
    </div>
  )
}