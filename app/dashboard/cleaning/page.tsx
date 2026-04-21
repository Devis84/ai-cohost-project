"use client"

import { useEffect, useState } from "react"

export default function CleaningDashboard() {
  const [tasks, setTasks] = useState([])

  async function fetchTasks() {
    const res = await fetch("/api/cleaning-tasks")
    const data = await res.json()
    setTasks(data.tasks || [])
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  async function updateTask(id: string, cleaner: string, status: string) {
    console.log("🔥 CLICK -> calling API", { id, cleaner, status })

    try {
      const res = await fetch("/api/update-cleaning-v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id,
          cleaner_name: cleaner,
          status
        })
      })

      const data = await res.json()
      console.log("✅ RESPONSE:", data)

      await fetchTasks()
    } catch (err) {
      console.error("❌ FETCH ERROR:", err)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🧹 Cleaning Dashboard</h1>

      <table style={{ width: "100%", marginTop: 20 }}>
        <thead>
          <tr>
            <th>Property</th>
            <th>Date</th>
            <th>Cleaner</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {tasks.map((task: any) => (
            <tr key={task.id}>
              <td>{task.property_id?.slice(0, 8)}</td>
              <td>{task.cleaning_date}</td>
              <td>{task.cleaner_name || "Unassigned"}</td>

              <td>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    background:
                      task.status === "completed" ? "#c8e6c9" : "#ffe0b2"
                  }}
                >
                  {task.status}
                </span>
              </td>

              <td style={{ display: "flex", gap: 10 }}>
                {/* SELECT */}
                <select
                  onChange={(e) =>
                    updateTask(task.id, e.target.value, "pending")
                  }
                >
                  <option value="">Select cleaner</option>
                  <option value="Mario">Mario</option>
                  <option value="Luigi">Luigi</option>
                  <option value="Anna">Anna</option>
                </select>

                {/* ASSIGN */}
                <button
                  onClick={() =>
                    updateTask(task.id, task.cleaner_name, "pending")
                  }
                >
                  Assign
                </button>

                {/* DONE */}
                <button
                  onClick={() =>
                    updateTask(task.id, task.cleaner_name, "completed")
                  }
                >
                  Done
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}