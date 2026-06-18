"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { TextArea } from "@/components/ui/TextArea"
import {
  CircleAlert,
  Calendar,
  Clock,
  User,
  Phone,
  ThumbsUp,
  Paintbrush,
  CheckCircle,
} from "lucide-react"

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
  actual_start_time?: string
  actual_end_time?: string
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
  final_check:
    "Lights, AC, windows, doors and overall presentation checked.",
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
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

    await updateTask(task.id, { checklist: updatedChecklist })
  }

  async function updateStatus(task: CleaningTask, status: string) {
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

    const payload: Partial<CleaningTask> = { status }

    if (status === "accepted") {
      payload.assigned_at = new Date().toISOString()
    }

    if (status === "in_progress") {
      payload.started_at = new Date().toISOString()
      payload.actual_start_time =
        task.actual_start_time || new Date().toTimeString().slice(0, 5)
    }

    if (status === "completed") {
      payload.completed_at = new Date().toISOString()
      payload.actual_end_time =
        task.actual_end_time || new Date().toTimeString().slice(0, 5)
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
    <div className="min-h-screen bg-background pb-10">
      <div className="sticky top-0 z-20 bg-primary text-on-primary px-5 pt-6 pb-7 rounded-b-[32px] shadow-2xl">
        <div className="max-w-xl mx-auto">
          <div className="uppercase tracking-[0.3em] text-xs text-on-primary/50 mb-3">
            AI CO-HOST CLEANING
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black mb-2">Cleaner App</h1>

              <p className="text-on-primary/60 text-sm">
                Mobile turnover checklist for active cleaning tasks.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchTasks}
              className="bg-on-primary/10 border border-on-primary/10 rounded-2xl px-4 py-3 text-sm font-bold"
            >
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-on-primary/10 rounded-3xl px-4 py-4 text-center">
              <div className="text-on-primary/50 text-xs mb-1">Active</div>
              <div className="text-2xl font-black">{tasks.length}</div>
            </div>

            <div className="bg-on-primary/10 rounded-3xl px-4 py-4 text-center">
              <div className="text-on-primary/50 text-xs mb-1">Urgent</div>
              <div className="text-2xl font-black">{urgentCount}</div>
            </div>

            <div className="bg-on-primary/10 rounded-3xl px-4 py-4 text-center">
              <div className="text-on-primary/50 text-xs mb-1">Started</div>
              <div className="text-2xl font-black">{inProgressCount}</div>
            </div>
          </div>

          {urgentCount > 0 && (
            <div className="mt-5 bg-error/20 border border-error/30 rounded-2xl px-4 py-3 text-sm text-on-primary flex items-center gap-2">
              <CircleAlert size={16} className="text-red-400" />
              {urgentCount} urgent cleaning task
              {urgentCount > 1 ? "s" : ""} need attention.
            </div>
          )}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6">
        {loading && (
          <Card variant="white" padding="p-6">
            <span className="text-outline">Loading tasks...</span>
          </Card>
        )}

        {!loading && tasks.length === 0 && (
          <Card variant="white" border padding="p-10" className="text-center">
            <div className="text-5xl mb-5">✅</div>

            <div className="text-2xl font-black text-on-surface mb-3">
              No active cleaning tasks
            </div>

            <div className="text-outline leading-relaxed">
              All current cleaning tasks are completed or there are no
              turnovers assigned.
            </div>
          </Card>
        )}

        {!loading && tasks.length > 0 && (
          <div className="mb-5 bg-white rounded-[28px] p-5 shadow-xl border border-black/5">
            <div className="font-black text-gray-900 mb-1">
              Today&apos;s cleaning workflow
            </div>

            <div className="text-sm text-gray-500 leading-relaxed">
              Open each task, follow the checklist and only mark it
              completed after the final check.
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">Accepted</div>
                <div className="text-2xl font-black">{acceptedCount}</div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">In progress</div>
                <div className="text-2xl font-black">{inProgressCount}</div>
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
            const isUpdating = updatingId === task.id

            return (
              <Card key={task.id} variant="white" border padding="p-5">
                <div className="mb-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="text-sm text-outline mb-1">
                        Property
                      </div>

                      <div className="text-2xl font-black leading-tight text-on-surface">
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
                    <div className="bg-surface-container px-4 py-2 rounded-2xl text-sm text-on-surface flex items-center gap-1.5">
                      <Calendar size={14} /> {formatDate(task.cleaning_date)}
                    </div>

                    {task.checkout_time && (
                      <div className="bg-surface-container px-4 py-2 rounded-2xl text-sm text-on-surface flex items-center gap-1.5">
                        <Clock size={14} /> Checkout: {task.checkout_time}
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
                  <div className="bg-surface-container-low rounded-2xl p-4 mb-5 border border-gray-100">
                    <div className="text-sm font-bold text-on-surface mb-2">
                      Assigned Cleaner
                    </div>

                    {task.cleaner_name && (
                      <div className="text-sm text-on-surface mb-1 flex items-center gap-2">
                        <User size={14} /> {task.cleaner_name}
                      </div>
                    )}

                    {task.cleaner_contact && (
                      <a
                        href={`tel:${task.cleaner_contact}`}
                        className="text-sm text-blue-700 font-semibold flex items-center gap-2"
                      >
                        <Phone size={14} /> {task.cleaner_contact}
                      </a>
                    )}
                  </div>
                )}

                {(task.assigned_at || task.started_at) && (
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {task.assigned_at && (
                      <div className="bg-surface-container-low rounded-2xl p-4 border border-gray-100">
                        <div className="text-xs text-outline mb-1">
                          Accepted
                        </div>

                        <div className="text-xs font-semibold text-on-surface">
                          {formatDateTime(task.assigned_at)}
                        </div>
                      </div>
                    )}

                    {task.started_at && (
                      <div className="bg-surface-container-low rounded-2xl p-4 border border-gray-100">
                        <div className="text-xs text-outline mb-1">
                          Started
                        </div>

                        <div className="text-xs font-semibold text-on-surface">
                          {formatDateTime(task.started_at)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-sm text-on-surface">
                      Cleaning Progress
                    </div>

                    <div className="text-sm text-outline">
                      {completedItems}/{totalItems} · {progress}%
                    </div>
                  </div>

                  <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        progress === 100 ? "bg-green-600" : "bg-primary"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {!canComplete && (
                    <div className="mt-3 text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3">
                      Final check is still pending. Complete it before
                      closing the task.
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
                          className={`flex items-start gap-4 rounded-2xl p-4 transition border cursor-pointer ${
                            value
                              ? "bg-accent/10 border-accent/20"
                              : "bg-surface-container-low border-gray-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={() => toggleChecklist(task, key)}
                            className="w-5 h-5 mt-1"
                            disabled={isUpdating}
                          />

                          <div>
                            <div className="font-bold text-on-surface">
                              {checklistLabels[key]}
                            </div>

                            <div className="text-xs text-outline leading-relaxed mt-1">
                              {checklistDescriptions[key]}
                            </div>
                          </div>
                        </label>
                      )
                    }
                  )}
                </div>

                <TextArea
                  placeholder="Add cleaning notes, missing items, damage, maintenance problems or anything the host should know..."
                  defaultValue={task.notes || ""}
                  onBlur={(event) =>
                    updateTask(task.id, { notes: event.target.value })
                  }
                  minHeight="min-h-[120px]"
                  className="mb-6"
                />

                <div className="flex flex-col gap-3">
                  {task.status === "pending" && (
                    <Button
                      variant="ai-action"
                      size="lg"
                      className="w-full"
                      onClick={() => updateStatus(task, "accepted")}
                      disabled={isUpdating}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <ThumbsUp size={18} /> Accept Task
                      </span>
                    </Button>
                  )}

                  {(task.status === "accepted" ||
                    task.status === "pending" ||
                    !task.status) && (
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full bg-warning/10 text-warning hover:bg-warning/20"
                      onClick={() => updateStatus(task, "in_progress")}
                      disabled={isUpdating}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Paintbrush size={18} /> Start Cleaning
                      </span>
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    size="lg"
                    className={`w-full ${
                      canComplete
                        ? "bg-accent/10 text-accent hover:bg-accent/20"
                        : "bg-gray-900 text-white"
                    }`}
                    onClick={() => updateStatus(task, "completed")}
                    disabled={isUpdating}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle size={18} />
                      {canComplete ? "Complete Cleaning" : "Complete Anyway"}
                    </span>
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
