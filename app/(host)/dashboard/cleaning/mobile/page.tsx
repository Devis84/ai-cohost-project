"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { TextArea } from "@/components/ui/TextArea"
import { CircleAlert, Calendar, Clock, User, Phone, ThumbsUp, Paintbrush, CheckCircle } from "lucide-react"

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

export default function CleanerMobilePage() {
  const [tasks, setTasks] = useState<CleaningTask[]>([])
  const [loading, setLoading] = useState(true)

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
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTasks() }, [])

  async function updateTask(id: string, payload: Partial<CleaningTask>) {
    try {
      await fetch("/api/cleaning-tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      })
      fetchTasks()
    } catch (err) {
      console.error(err)
    }
  }

  async function toggleChecklist(task: CleaningTask, key: keyof Checklist) {
    const checklist = { ...defaultChecklist, ...(task.checklist || {}) }
    await updateTask(task.id, { checklist: { ...checklist, [key]: !checklist[key] } })
  }

  async function updateStatus(task: CleaningTask, status: string) {
    const payload: Partial<CleaningTask> = { status }
    if (status === "accepted") payload.assigned_at = new Date().toISOString()
    if (status === "in_progress") payload.started_at = new Date().toISOString()
    if (status === "completed") payload.completed_at = new Date().toISOString()
    await updateTask(task.id, payload)
  }

  const urgentCount = useMemo(() => {
    return tasks.filter((task) => task.priority === "urgent").length
  }, [tasks])

  return (
    <div className="min-h-screen bg-background pb-10">

      <div className="sticky top-0 z-20 bg-primary text-on-primary px-5 pt-6 pb-7 rounded-b-[32px] shadow-2xl">
        <div className="uppercase tracking-[0.3em] text-xs text-on-primary/50 mb-3">AI CO-HOST</div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Cleaner App</h1>
            <p className="text-on-primary/60 text-sm">Mobile cleaning workflow</p>
          </div>
          <div className="bg-on-primary/10 rounded-3xl px-5 py-4 text-center min-w-[90px]">
            <div className="text-on-primary/50 text-xs mb-1">Active</div>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </div>
        </div>

        {urgentCount > 0 && (
          <div className="mt-5 bg-error/20 border border-error/30 rounded-2xl px-4 py-3 text-sm text-on-primary flex items-center gap-2">
            <CircleAlert size={16} className="text-red-400" /> {urgentCount} urgent cleaning task{urgentCount > 1 ? "s" : ""}
          </div>
        )}
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6">

        {loading && (
          <Card variant="white" padding="p-6">
            <span className="text-outline">Loading tasks...</span>
          </Card>
        )}

        {!loading && tasks.length === 0 && (
          <Card variant="white" border padding="p-10" className="text-center">
            <span className="text-outline">No active cleaning tasks</span>
          </Card>
        )}

        <div className="space-y-5">
          {tasks.map((task) => {
            const checklist = { ...defaultChecklist, ...(task.checklist || {}) }
            const completedItems = Object.values(checklist).filter(Boolean).length
            const totalItems = Object.keys(checklist).length
            const progress = Math.round((completedItems / totalItems) * 100)

            return (
              <Card key={task.id} variant="white" border padding="p-5">

                <div className="mb-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="text-sm text-outline mb-1">Property</div>
                      <div className="text-2xl font-bold text-on-surface leading-tight">{task.property_name}</div>
                    </div>
                    <Badge color={task.priority === "urgent" ? "error" : "default"} size="sm">
                      {task.priority || "normal"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <div className="bg-surface-container px-4 py-2 rounded-2xl text-sm text-on-surface flex items-center gap-1.5">
                      <Calendar size={14} /> {task.cleaning_date}
                    </div>
                    {task.checkout_time && (
                      <div className="bg-surface-container px-4 py-2 rounded-2xl text-sm text-on-surface flex items-center gap-1.5">
                        <Clock size={14} /> {task.checkout_time}
                      </div>
                    )}
                    <Badge color="neutral" size="sm">{task.status || "pending"}</Badge>
                  </div>
                </div>

                {(task.cleaner_name || task.cleaner_contact) && (
                  <div className="bg-surface-container-low rounded-2xl p-4 mb-5">
                    <div className="text-sm font-semibold text-on-surface mb-2">Assigned Cleaner</div>
                    {task.cleaner_name && (
                      <div className="text-sm text-on-surface mb-1 flex items-center gap-2">
                        <User size={14} /> {task.cleaner_name}
                      </div>
                    )}
                    {task.cleaner_contact && (
                      <div className="text-sm text-on-surface flex items-center gap-2">
                        <Phone size={14} /> {task.cleaner_contact}
                      </div>
                    )}
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-sm text-on-surface">Cleaning Progress</div>
                    <div className="text-sm text-outline">{progress}%</div>
                  </div>
                  <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {Object.entries(checklist).map(([key, value]) => (
                    <label
                      key={key}
                      className={`flex items-center gap-4 rounded-2xl p-4 transition cursor-pointer ${
                        value ? "bg-accent/10 border border-accent/20" : "bg-surface-container-low"
                      }`}
                    >
                      <input type="checkbox" checked={value} onChange={() => toggleChecklist(task, key as keyof Checklist)} className="w-5 h-5" />
                      <span className="capitalize font-medium text-on-surface">{key.replace("_", " ")}</span>
                    </label>
                  ))}
                </div>

                <TextArea
                  placeholder="Cleaning notes..."
                  defaultValue={task.notes || ""}
                  onBlur={(e) => updateTask(task.id, { notes: e.target.value })}
                  minHeight="min-h-[120px]"
                  className="mb-6"
                />

                <div className="flex flex-col gap-3">
                  {task.status === "pending" && (
                    <Button variant="ai-action" size="lg" className="w-full" onClick={() => updateStatus(task, "accepted")}>
                      <span className="flex items-center justify-center gap-2"><ThumbsUp size={18} /> Accept Task</span>
                    </Button>
                  )}

                  {(task.status === "accepted" || task.status === "pending") && (
                    <Button variant="secondary" size="lg" className="w-full bg-warning/10 text-warning hover:bg-warning/20" onClick={() => updateStatus(task, "in_progress")}>
                      <span className="flex items-center justify-center gap-2"><Paintbrush size={18} /> Start Cleaning</span>
                    </Button>
                  )}

                  <Button variant="secondary" size="lg" className="w-full bg-accent/10 text-accent hover:bg-accent/20" onClick={() => updateStatus(task, "completed")}>
                    <span className="flex items-center justify-center gap-2"><CheckCircle size={18} /> Mark as Completed</span>
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
