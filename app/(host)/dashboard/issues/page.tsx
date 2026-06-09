 "use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle } from "lucide-react"

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
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

function getPriority(issue: Issue) {
  return issue.priority || issue.severity || "normal"
}

function getPriorityClass(priority: string) {
  const normalized = priority.toLowerCase()
  if (normalized === "high" || normalized === "urgent") return "bg-red-50 text-red-700 border-red-100"
  if (normalized === "medium") return "bg-orange-50 text-orange-700 border-orange-100"
  return "bg-gray-100 text-gray-600 border-gray-100"
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [resolvingId, setResolvingId] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  async function loadIssues() {
    try {
      setLoading(true)
      setErrorMessage("")
      const response = await fetch("/api/issues")
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to load issues")
      setIssues(data.issues || [])
    } catch (error) {
      console.error("LOAD ISSUES ERROR:", error)
      setErrorMessage("Unable to load issues at the moment.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadIssues() }, [])

  const openIssues = useMemo(() => {
    return issues.filter((issue) => {
      const status = issue.status?.toLowerCase() || "open"
      return status !== "resolved" && status !== "closed"
    })
  }, [issues])

  async function resolveIssue(issueId: string) {
    try {
      setResolvingId(issueId)
      const response = await fetch("/api/issues/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to resolve issue")
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
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <div className="uppercase tracking-[0.25em] text-[11px] text-gray-400 font-semibold mb-2">HOST OPERATIONS</div>
            <h1 className="text-3xl font-bold text-gray-900">Issues</h1>
            <div className="text-gray-500 mt-2">Review guest issues, escalations and items that may require host attention.</div>
          </div>
          <Link href="/dashboard" className="bg-black text-white px-6 py-4 rounded-2xl font-semibold shadow-xl hover:opacity-90 transition">Back to Dashboard</Link>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {loading && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8">
            <div className="text-xl font-bold text-gray-900 mb-2">Loading issues</div>
            <div className="text-gray-500">Please wait while we check the latest guest issues.</div>
          </div>
        )}

        {!loading && errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-3xl p-6 font-medium">{errorMessage}</div>
        )}

        {!loading && !errorMessage && openIssues.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-10 text-center">
            <div className="flex justify-center mb-5"><CheckCircle size={48} className="text-green-500" /></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No open issues</h2>
            <p className="text-gray-500 max-w-xl mx-auto">There are currently no unresolved guest issues requiring your attention.</p>
          </div>
        )}

        {!loading && !errorMessage && openIssues.length > 0 && (
          <div className="space-y-5">
            {openIssues.map((issue) => {
              const priority = getPriority(issue)
              const issueTitle = issue.issue_type || issue.severity || issue.priority || "Guest issue"
              const description = issue.description || issue.message || "No description provided."
              const propertyName = issue.property_name || (issue.property_id ? `Property ${issue.property_id.slice(0, 8)}` : "Unknown property")
              const propertyCity = issue.property_city || ""

              return (
                <div key={issue.id} className="bg-white rounded-3xl border border-gray-200 shadow-xl p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className={`border rounded-full px-3 py-1 text-xs font-bold uppercase ${getPriorityClass(priority)}`}>{priority}</span>
                        <span className="bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-xs font-semibold uppercase">{issue.status || "open"}</span>
                        <span className="bg-black text-white rounded-full px-3 py-1 text-xs font-semibold uppercase">{formatLabel(issueTitle)}</span>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">{propertyName}</h2>
                      {propertyCity && <div className="text-sm text-gray-500 mb-4">{propertyCity}</div>}
                      {issue.guest_name && <div className="text-sm text-gray-500 mb-3">Guest: {issue.guest_name}</div>}
                      {issue.conversation_id && <div className="text-xs text-gray-400 mb-4 break-all">Conversation: {issue.conversation_id}</div>}
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{description}</p>
                      {issue.created_at && <div className="text-xs text-gray-400 mt-4">Created: {new Date(issue.created_at).toLocaleString()}</div>}
                    </div>
                    <button onClick={() => resolveIssue(issue.id)} disabled={resolvingId === issue.id} className="bg-black text-white px-6 py-4 rounded-2xl font-semibold hover:opacity-90 transition disabled:opacity-50">
                      {resolvingId === issue.id ? "Resolving..." : "Resolve"}
                    </button>
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
