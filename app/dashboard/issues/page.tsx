"use client"

import { useEffect, useState } from "react"

type Issue = {
  id: string
  property_id: string
  message: string
  severity: string
  status: string
}

export default function IssuesPage() {

  const [issues, setIssues] = useState<Issue[]>([])

  useEffect(() => {
    loadIssues()
  }, [])

  async function loadIssues() {

    const res = await fetch("/api/issues")
    const data = await res.json()

    if (data.issues) {
      setIssues(data.issues)
    }

  }

  async function resolveIssue(issueId: string) {

    await fetch("/api/issues/resolve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        issueId
      })
    })

    loadIssues()

  }

  const openIssues = issues.filter(i => i.status === "open")

  return (

    <div style={{ padding: 40, fontFamily: "sans-serif" }}>

      <h1>Open Issues</h1>

      {openIssues.map(issue => (

        <div
          key={issue.id}
          style={{
            border: "1px solid #ccc",
            padding: 20,
            marginTop: 20,
            borderRadius: 8
          }}
        >

          <h3>Property {issue.property_id.slice(0,8)}</h3>

          <p>{issue.message}</p>

          <p>Severity: {issue.severity}</p>

          <p>Status: {issue.status}</p>

          <button
            onClick={() => resolveIssue(issue.id)}
            style={{
              marginTop: 10,
              padding: "8px 16px",
              cursor: "pointer"
            }}
          >
            Resolve
          </button>

        </div>

      ))}

    </div>

  )

}