 "use client"

import { useEffect, useMemo, useState } from "react"

type Checklist = {
  bathroom: boolean
  kitchen: boolean
  bedroom: boolean
  trash: boolean
  towels: boolean
  final_check: boolean
}

type CleaningTask = {
  id: string
  property_name?: string
  cleaning_date?: string
  checkout_time?: string
  cleaner_name?: string
  cleaner_contact?: string
  priority?: string
  status?: string
  notes?: string
  assigned_at?: string
  started_at?: string
  completed_at?: string
  checklist?: Checklist
}

const defaultChecklist: Checklist = {
  bathroom: false,
  kitchen: false,
  bedroom: false,
  trash: false,
  towels: false,
  final_check: false,
}

const checklistLabels: Record<keyof Checklist, string> = {
  bathroom: "Bathroom cleaned",
  kitchen: "Kitchen cleaned",
  bedroom: "Bedroom reset",
  trash: "Trash removed",
  towels: "Towels & linen ready",
  final_check: "Final check completed",
}

const checklistDescriptions: Record<keyof Checklist, string> = {
  bathroom: "Shower, toilet, sink, mirror and floor checked.",
  kitchen: "Surfaces, sink, dishes, appliances and rubbish checked.",
  bedroom: "Bed made, floor checked and room ready for guest arrival.",
  trash: "All rubbish removed and bins checked.",
  towels: "Fresh towels and linen prepared for the next guest.",
  final_check: "Lights, AC, windows, doors and overall presentation checked.",
}

function formatStatus(status?: string) {
  if (!status) return "Pending"

  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatDate(value?: string) {
  if (!value) return "No date"

  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return value
  }
}

function formatDateTime(value?: string) {
  if (!value) return ""

  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

function getStatusStyle(status?: string) {
  if (status === "completed") {
    return "bg-green-100 text-green-700"
  }

  if (status === "in_progress") {
    return "bg-orange-100 text-orange-700"
  }

  if (status === "accepted") {
    return "bg-blue-100 text-blue-700"
  }

  return "bg-gray-100 text-gray-700"
}

function getPriorityStyle(priority?: string) {
  if (priority === "urgent") {
    return "bg-red-100 text-red-700"
  }

  if (priority === "high") {
    return "bg-orange-100 text-orange-700"
  }

  return "bg-blue-100 text-blue-700"
}

export default function CleanerMobilePage() {
  const [tasks, setTasks] = useState<CleaningTask[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState("")

  async function fetchTasks() {
    try {
      setLoading(true)

      const res = await fetch("/api/cleaning-tasks")
      const data = await res.json()

      const activeTasks = (data.tasks || []).filter(
        (task: CleaningTask) => task.status !== "completed"
      )

      setTasks(activeTasks)
    } catch (err) {
      console.error("FETCH CLEANING TASKS ERROR:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  async function updateTask(
    id: string,
    payload: Partial<CleaningTask>
  ) {
    try {
      setUpdatingId(id)

      await fetch("/api/cleaning-tasks", {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          id,
          ...payload,
        }),
      })

      await fetchTasks()
    } catch (err) {
      console.error("UPDATE CLEANING TASK ERROR:", err)
    } finally {
      setUpdatingId("")
    }
  }

  async function toggleChecklist(
    task: CleaningTask,
    key: keyof Checklist
  ) {
    const checklist = {
      ...defaultChecklist,
      ...(task.checklist || {}),
    }

    const updatedChecklist = {
      ...checklist,
      [key]: !checklist[key],
    }

    await updateTask(task.id, {
      checklist: updatedChecklist,
    })
  }

  async function updateStatus(
    task: CleaningTask,
    status: string
  ) {
    const checklist = {
      ...defaultChecklist,
      ...(task.checklist || {}),
    }

    if (status === "completed" && !checklist.final_check) {
      const confirmed = confirm(
        "Final check is not completed yet. Are you sure you want to mark this cleaning as completed?"
      )

      if (!confirmed) {
        return
      }
    }

    const payload: Partial<CleaningTask> = {
      status,
    }

    if (status === "accepted") {
      payload.assigned_at = new Date().toISOString()
    }

    if (status === "in_progress") {
      payload.started_at = new Date().toISOString()
    }

    if (status === "completed") {
      payload.completed_at = new Date().toISOString()
    }

    await updateTask(task.id, payload)
  }

  const urgentCount = useMemo(() => {
    return tasks.filter((task) => task.priority === "urgent").length
  }, [tasks])

  const inProgressCount = useMemo(() => {
    return tasks.filter((task) => task.status === "in_progress").length
  }, [tasks])

  const acceptedCount = useMemo(() => {
    return tasks.filter((task) => task.status === "accepted").length
  }, [tasks])

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-10">
      <div className="sticky top-0 z-20 bg-black text-white px-5 pt-6 pb-7 rounded-b-[32px] shadow-2xl">
        <div className="max-w-xl mx-auto">
          <div className="uppercase tracking-[0.3em] text-xs text-white/50 mb-3">
            AI CO-HOST CLEANING
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black mb-2">
                Cleaner App
              </h1>

              <p className="text-white/60 text-sm">
                Mobile turnover checklist for active cleaning tasks.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchTasks}
              className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold"
            >
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-white/10 rounded-3xl px-4 py-4 text-center">
              <div className="text-white/50 text-xs mb-1">
                Active
              </div>

              <div className="text-2xl font-black">
                {tasks.length}
              </div>
            </div>

            <div className="bg-white/10 rounded-3xl px-4 py-4 text-center">
              <div className="text-white/50 text-xs mb-1">
                Urgent
              </div>

              <div className="text-2xl font-black">
                {urgentCount}
              </div>
            </div>

            <div className="bg-white/10 rounded-3xl px-4 py-4 text-center">
              <div className="text-white/50 text-xs mb-1">
                Started
              </div>

              <div className="text-2xl font-black">
                {inProgressCount}
              </div>
            </div>
          </div>

          {urgentCount > 0 && (
            <div className="mt-5 bg-red-500/20 border border-red-500/20 rounded-2xl px-4 py-3 text-sm text-red-100">
              🔴 {urgentCount} urgent cleaning task
              {urgentCount > 1 ? "s" : ""} need attention.
            </div>
          )}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6">
        {loading && (
          <div className="bg-white rounded-[32px] p-6 shadow-xl border border-black/5 text-gray-500">
            Loading tasks...
          </div>
        )}

        {!loading && tasks.length === 0 && (
          <div className="bg-white rounded-[32px] p-10 text-center shadow-xl border border-black/5">
            <div className="text-5xl mb-5">✅</div>

            <div className="text-2xl font-black text-gray-900 mb-3">
              No active cleaning tasks
            </div>

            <div className="text-gray-500 leading-relaxed">
              All current cleaning tasks are completed or there are no turnovers assigned.
            </div>
          </div>
        )}

        {!loading && tasks.length > 0 && (
          <div className="mb-5 bg-white rounded-[28px] p-5 shadow-xl border border-black/5">
            <div className="font-black text-gray-900 mb-1">
              Today’s cleaning workflow
            </div>

            <div className="text-sm text-gray-500 leading-relaxed">
              Open each task, follow the checklist and only mark it completed after the final check.
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">
                  Accepted
                </div>

                <div className="text-2xl font-black">
                  {acceptedCount}
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">
                  In progress
                </div>

                <div className="text-2xl font-black">
                  {inProgressCount}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-5">
          {tasks.map((task) => {
            const checklist = {
              ...defaultChecklist,
              ...(task.checklist || {}),
            }

            const completedItems =
              Object.values(checklist).filter(Boolean).length

            const totalItems = Object.keys(checklist).length

            const progress = Math.round(
              (completedItems / totalItems) * 100
            )

            const canComplete = checklist.final_check

            return (
              <div
                key={task.id}
                className="bg-white rounded-[32px] p-5 shadow-xl border border-black/5"
              >
                <div className="mb-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">
                        Property
                      </div>

                      <div className="text-2xl font-black leading-tight text-gray-950">
                        {task.property_name || "Unknown property"}
                      </div>
                    </div>

                    <div
                      className={`px-4 py-2 rounded-2xl text-xs font-bold uppercase ${getPriorityStyle(
                        task.priority
                      )}`}
                    >
                      {task.priority || "normal"}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <div className="bg-gray-100 px-4 py-2 rounded-2xl text-sm font-medium">
                      📅 {formatDate(task.cleaning_date)}
                    </div>

                    {task.checkout_time && (
                      <div className="bg-gray-100 px-4 py-2 rounded-2xl text-sm font-medium">
                        ⏰ Checkout: {task.checkout_time}
                      </div>
                    )}

                    <div
                      className={`px-4 py-2 rounded-2xl text-sm font-bold ${getStatusStyle(
                        task.status
                      )}`}
                    >
                      {formatStatus(task.status)}
                    </div>
                  </div>
                </div>

                {(task.cleaner_name || task.cleaner_contact) && (
                  <div className="bg-gray-50 rounded-2xl p-4 mb-5 border border-gray-100">
                    <div className="text-sm font-bold mb-2">
                      Assigned Cleaner
                    </div>

                    {task.cleaner_name && (
                      <div className="text-sm mb-1">
                        👤 {task.cleaner_name}
                      </div>
                    )}

                    {task.cleaner_contact && (
                      <a
                        href={`tel:${task.cleaner_contact}`}
                        className="text-sm text-blue-700 font-semibold"
                      >
                        📞 {task.cleaner_contact}
                      </a>
                    )}
                  </div>
                )}

                {(task.assigned_at || task.started_at) && (
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {task.assigned_at && (
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="text-xs text-gray-400 mb-1">
                          Accepted
                        </div>

                        <div className="text-xs font-semibold text-gray-700">
                          {formatDateTime(task.assigned_at)}
                        </div>
                      </div>
                    )}

                    {task.started_at && (
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="text-xs text-gray-400 mb-1">
                          Started
                        </div>

                        <div className="text-xs font-semibold text-gray-700">
                          {formatDateTime(task.started_at)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-sm">
                      Cleaning Progress
                    </div>

                    <div className="text-sm text-gray-500">
                      {completedItems}/{totalItems} · {progress}%
                    </div>
                  </div>

                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        progress === 100
                          ? "bg-green-600"
                          : "bg-black"
                      }`}
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>

                  {!canComplete && (
                    <div className="mt-3 text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3">
                      Final check is still pending. Complete it before closing the task.
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  {(Object.keys(checklist) as Array<keyof Checklist>).map(
                    (key) => {
                      const value = checklist[key]

                      return (
                        <label
                          key={key}
                          className={`flex items-start gap-4 rounded-2xl p-4 transition border ${
                            value
                              ? "bg-green-50 border-green-100"
                              : "bg-gray-50 border-gray-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={() => toggleChecklist(task, key)}
                            className="w-5 h-5 mt-1"
                            disabled={updatingId === task.id}
                          />

                          <div>
                            <div className="font-bold text-gray-900">
                              {checklistLabels[key]}
                            </div>

                            <div className="text-xs text-gray-500 leading-relaxed mt-1">
                              {checklistDescriptions[key]}
                            </div>
                          </div>
                        </label>
                      )
                    }
                  )}
                </div>

                <div className="mb-6">
                  <div className="text-sm font-bold text-gray-900 mb-2">
                    Cleaner Notes
                  </div>

                  <textarea
                    placeholder="Add cleaning notes, missing items, damage, maintenance problems or anything the host should know..."
                    defaultValue={task.notes || ""}
                    onBlur={(event) =>
                      updateTask(task.id, {
                        notes: event.target.value,
                      })
                    }
                    className="w-full border border-gray-200 rounded-2xl p-4 min-h-[120px] outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  {task.status === "pending" && (
                    <button
                      onClick={() => updateStatus(task, "accepted")}
                      disabled={updatingId === task.id}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-5 py-4 font-bold transition disabled:opacity-50"
                    >
                      👍 Accept Task
                    </button>
                  )}

                  {(task.status === "accepted" ||
                    task.status === "pending" ||
                    !task.status) && (
                    <button
                      onClick={() =>
                        updateStatus(task, "in_progress")
                      }
                      disabled={updatingId === task.id}
                      className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-5 py-4 font-bold transition disabled:opacity-50"
                    >
                      🧹 Start Cleaning
                    </button>
                  )}

                  <button
                    onClick={() => updateStatus(task, "completed")}
                    disabled={updatingId === task.id}
                    className={`rounded-2xl px-5 py-4 font-bold transition disabled:opacity-50 ${
                      canComplete
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-gray-900 text-white"
                    }`}
                  >
                    {canComplete
                      ? "✅ Complete Cleaning"
                      : "⚠️ Complete Anyway"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}