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
  property_id?: string | null
  property_name?: string | null
  cleaning_date?: string | null
  checkout_date?: string | null
  checkout_time?: string | null
  next_checkin_date?: string | null
  next_checkin_time?: string | null
  planned_start_time?: string | null
  planned_end_time?: string | null
  actual_start_time?: string | null
  actual_end_time?: string | null
  cleaner_name?: string | null
  cleaner_contact?: string | null
  hourly_rate?: number | string | null
  extra_fee?: number | string | null
  currency?: string | null
  status?: string | null
  priority?: string | null
  notes?: string | null
  assigned_at?: string | null
  started_at?: string | null
  completed_at?: string | null
  checklist?: Checklist | null
}

type TaskDraft = {
  cleaner_name: string
  cleaner_contact: string
  actual_start_time: string
  actual_end_time: string
  hourly_rate: string
  extra_fee: string
  notes: string
}

type CleanerSummary = {
  cleaner: string
  hours: number
  amount: number
  tasks: number
  completed: number
  open: number
  missingTime: number
  missingRate: number
}

const defaultChecklist: Checklist = {
  bathroom: false,
  kitchen: false,
  bedroom: false,
  trash: false,
  towels: false,
  final_check: false,
}

const statusOptions = [
  "all",
  "pending",
  "accepted",
  "in_progress",
  "completed",
]

const periodOptions = [
  "all",
  "this_week",
  "this_month",
]

function safeText(value?: string | null) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : ""
}

function toNumber(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return 0
  }

  const numberValue = Number(value)

  return Number.isNaN(numberValue) ? 0 : numberValue
}

function calculateHours(
  start?: string | null,
  end?: string | null
) {
  if (!start || !end) {
    return 0
  }

  const [startHour, startMinute] = start.split(":").map(Number)
  const [endHour, endMinute] = end.split(":").map(Number)

  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMinute) ||
    Number.isNaN(endHour) ||
    Number.isNaN(endMinute)
  ) {
    return 0
  }

  const startTotal = startHour * 60 + startMinute
  const endTotal = endHour * 60 + endMinute

  if (endTotal <= startTotal) {
    return 0
  }

  return Math.round(((endTotal - startTotal) / 60) * 100) / 100
}

function getTaskHours(task: CleaningTask) {
  return calculateHours(
    safeText(task.actual_start_time),
    safeText(task.actual_end_time)
  )
}

function getDraftHours(draft?: TaskDraft) {
  if (!draft) {
    return 0
  }

  return calculateHours(
    draft.actual_start_time,
    draft.actual_end_time
  )
}

function getTaskAmount(task: CleaningTask) {
  const hours = getTaskHours(task)
  const rate = toNumber(task.hourly_rate)
  const extra = toNumber(task.extra_fee)

  return Math.round((hours * rate + extra) * 100) / 100
}

function getDraftAmount(draft?: TaskDraft) {
  if (!draft) {
    return 0
  }

  const hours = getDraftHours(draft)
  const rate = toNumber(draft.hourly_rate)
  const extra = toNumber(draft.extra_fee)

  return Math.round((hours * rate + extra) * 100) / 100
}

function formatMoney(amount: number, currency = "EUR") {
  return `${currency} ${amount.toFixed(2)}`
}

function getChecklistProgress(task: CleaningTask) {
  const checklist = {
    ...defaultChecklist,
    ...(task.checklist || {}),
  }

  const values = Object.values(checklist)
  const completed = values.filter(Boolean).length
  const total = values.length
  const percent =
    total > 0 ? Math.round((completed / total) * 100) : 0

  return {
    checklist,
    completed,
    total,
    percent,
  }
}

function getTaskDate(task: CleaningTask) {
  return (
    safeText(task.cleaning_date) ||
    safeText(task.checkout_date) ||
    ""
  )
}

function groupTasksByDate(tasks: CleaningTask[]) {
  return tasks.reduce<Record<string, CleaningTask[]>>(
    (groups, task) => {
      const date = getTaskDate(task) || "Unscheduled"

      if (!groups[date]) {
        groups[date] = []
      }

      groups[date].push(task)

      return groups
    },
    {}
  )
}

function createDraftFromTask(task: CleaningTask): TaskDraft {
  return {
    cleaner_name: safeText(task.cleaner_name),
    cleaner_contact: safeText(task.cleaner_contact),
    actual_start_time: safeText(task.actual_start_time),
    actual_end_time: safeText(task.actual_end_time),
    hourly_rate:
      task.hourly_rate === undefined ||
      task.hourly_rate === null
        ? ""
        : String(task.hourly_rate),
    extra_fee:
      task.extra_fee === undefined || task.extra_fee === null
        ? ""
        : String(task.extra_fee),
    notes: safeText(task.notes),
  }
}

function startOfWeek(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1)

  copy.setDate(diff)
  copy.setHours(0, 0, 0, 0)

  return copy
}

function endOfWeek(date: Date) {
  const start = startOfWeek(date)
  const end = new Date(start)

  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return end
}

function isTaskInPeriod(task: CleaningTask, period: string) {
  if (period === "all") {
    return true
  }

  const rawDate = getTaskDate(task)

  if (!rawDate) {
    return false
  }

  const date = new Date(`${rawDate}T12:00:00`)
  const now = new Date()

  if (Number.isNaN(date.getTime())) {
    return false
  }

  if (period === "this_week") {
    return date >= startOfWeek(now) && date <= endOfWeek(now)
  }

  if (period === "this_month") {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    )
  }

  return true
}

function getTaskWarnings(task: CleaningTask) {
  const warnings: string[] = []

  if (!safeText(task.cleaner_name)) {
    warnings.push("No cleaner assigned")
  }

  if (
    !safeText(task.planned_start_time) ||
    !safeText(task.planned_end_time)
  ) {
    warnings.push("Missing planned cleaning time")
  }

  if (
    task.status === "completed" &&
    (!safeText(task.actual_start_time) ||
      !safeText(task.actual_end_time))
  ) {
    warnings.push("Completed but missing actual time")
  }

  if (
    safeText(task.actual_start_time) &&
    safeText(task.actual_end_time) &&
    getTaskHours(task) === 0
  ) {
    warnings.push("Actual end time must be after start time")
  }

  if (toNumber(task.hourly_rate) === 0) {
    warnings.push("Missing hourly rate")
  }

  if (
    safeText(task.checkout_date) &&
    safeText(task.next_checkin_date) &&
    task.checkout_date === task.next_checkin_date
  ) {
    warnings.push("Same-day turnover")
  }

  if (
    safeText(task.checkout_time) &&
    safeText(task.next_checkin_time) &&
    safeText(task.checkout_date) &&
    safeText(task.next_checkin_date) &&
    task.checkout_date === task.next_checkin_date
  ) {
    const availableHours = calculateHours(
      task.checkout_time,
      task.next_checkin_time
    )

    if (availableHours > 0 && availableHours <= 4) {
      warnings.push("Tight turnover window")
    }
  }

  return warnings
}

function FieldLabel({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="mb-2">
      <label className="block text-sm font-bold text-gray-800">
        {title}
      </label>

      {description && (
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}

function SectionTitle({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-black text-white rounded-2xl w-9 h-9 flex items-center justify-center font-bold text-sm">
          {number}
        </div>

        <h3 className="text-xl font-black">
          {title}
        </h3>
      </div>

      <p className="text-sm text-gray-500 leading-relaxed">
        {description}
      </p>
    </div>
  )
}

function StatusBadge({
  value,
}: {
  value?: string | null
}) {
  const status = value || "pending"

  const className =
    status === "completed"
      ? "bg-green-100 text-green-700"
      : status === "in_progress"
        ? "bg-orange-100 text-orange-700"
        : status === "accepted"
          ? "bg-blue-100 text-blue-700"
          : "bg-black text-white"

  return (
    <span
      className={`px-4 py-2 rounded-2xl text-sm font-semibold capitalize ${className}`}
    >
      {status.replace("_", " ")}
    </span>
  )
}

export default function CleaningDashboard() {
  const [tasks, setTasks] = useState<CleaningTask[]>([])
  const [drafts, setDrafts] = useState<Record<string, TaskDraft>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState("all")
  const [periodFilter, setPeriodFilter] = useState("all")

  const [propertyName, setPropertyName] = useState("")
  const [cleaningDate, setCleaningDate] = useState("")
  const [checkoutDate, setCheckoutDate] = useState("")
  const [checkoutTime, setCheckoutTime] = useState("")
  const [nextCheckinDate, setNextCheckinDate] = useState("")
  const [nextCheckinTime, setNextCheckinTime] = useState("")
  const [plannedStartTime, setPlannedStartTime] = useState("")
  const [plannedEndTime, setPlannedEndTime] = useState("")
  const [cleanerName, setCleanerName] = useState("")
  const [cleanerContact, setCleanerContact] = useState("")
  const [hourlyRate, setHourlyRate] = useState("")

  function rebuildDrafts(nextTasks: CleaningTask[]) {
    const nextDrafts: Record<string, TaskDraft> = {}

    nextTasks.forEach((task) => {
      nextDrafts[task.id] =
        drafts[task.id] || createDraftFromTask(task)
    })

    setDrafts(nextDrafts)
  }

  async function fetchTasks() {
    try {
      setLoading(true)

      const res = await fetch("/api/cleaning-tasks")
      const data = await res.json()
      const nextTasks = data.tasks || []

      setTasks(nextTasks)
      rebuildDrafts(nextTasks)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateDraft(
    taskId: string,
    field: keyof TaskDraft,
    value: string
  ) {
    setDrafts((current) => ({
      ...current,
      [taskId]: {
        ...(current[taskId] || {
          cleaner_name: "",
          cleaner_contact: "",
          actual_start_time: "",
          actual_end_time: "",
          hourly_rate: "",
          extra_fee: "",
          notes: "",
        }),
        [field]: value,
      },
    }))
  }

  async function createTask() {
    if (!propertyName || !cleaningDate) {
      alert("Property name and cleaning date are required")
      return
    }

    try {
      setSaving(true)

      const res = await fetch("/api/cleaning-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          property_name: propertyName,
          cleaning_date: cleaningDate,
          checkout_date: checkoutDate || cleaningDate,
          checkout_time: checkoutTime,
          next_checkin_date: nextCheckinDate,
          next_checkin_time: nextCheckinTime,
          planned_start_time: plannedStartTime,
          planned_end_time: plannedEndTime,
          cleaner_name: cleanerName,
          cleaner_contact: cleanerContact,
          hourly_rate: hourlyRate,
          currency: "EUR",
          status: "pending",
          priority: "normal",
          checklist: defaultChecklist,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        alert(data.error || "Error creating task")
        return
      }

      setPropertyName("")
      setCleaningDate("")
      setCheckoutDate("")
      setCheckoutTime("")
      setNextCheckinDate("")
      setNextCheckinTime("")
      setPlannedStartTime("")
      setPlannedEndTime("")
      setCleanerName("")
      setCleanerContact("")
      setHourlyRate("")

      await fetchTasks()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function updateTask(
    id: string,
    payload: Partial<CleaningTask>
  ) {
    try {
      const res = await fetch("/api/cleaning-tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          ...payload,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        console.error(data.error)
        alert(data.error || "Error updating task")
      }

      await fetchTasks()
    } catch (err) {
      console.error(err)
    }
  }

  async function saveTaskDraft(task: CleaningTask) {
    const draft = drafts[task.id]

    if (!draft) {
      return
    }

    await updateTask(task.id, {
      cleaner_name: draft.cleaner_name,
      cleaner_contact: draft.cleaner_contact,
      actual_start_time: draft.actual_start_time,
      actual_end_time: draft.actual_end_time,
      hourly_rate: draft.hourly_rate,
      extra_fee: draft.extra_fee,
      notes: draft.notes,
    })
  }

  async function deleteTask(id: string) {
    const confirmed = confirm("Delete this cleaning task?")

    if (!confirmed) {
      return
    }

    try {
      const res = await fetch("/api/cleaning-tasks", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        alert(data.error || "Error deleting task")
        return
      }

      await fetchTasks()
    } catch (err) {
      console.error(err)
    }
  }

  async function toggleChecklistItem(
    task: CleaningTask,
    key: keyof Checklist
  ) {
    const currentChecklist = {
      ...defaultChecklist,
      ...(task.checklist || {}),
    }

    const updatedChecklist = {
      ...currentChecklist,
      [key]: !currentChecklist[key],
    }

    await updateTask(task.id, {
      checklist: updatedChecklist,
    })
  }

  async function updateStatus(
    task: CleaningTask,
    status: string
  ) {
    const payload: Partial<CleaningTask> = {
      status,
    }

    if (status === "accepted") {
      payload.assigned_at = new Date().toISOString()
    }

    if (status === "in_progress") {
      payload.started_at = new Date().toISOString()
      payload.actual_start_time =
        task.actual_start_time ||
        drafts[task.id]?.actual_start_time ||
        new Date().toTimeString().slice(0, 5)
    }

    if (status === "completed") {
      payload.completed_at = new Date().toISOString()
      payload.actual_end_time =
        task.actual_end_time ||
        drafts[task.id]?.actual_end_time ||
        new Date().toTimeString().slice(0, 5)
    }

    await updateTask(task.id, payload)
  }

  const periodTasks = useMemo(() => {
    return tasks.filter((task) =>
      isTaskInPeriod(task, periodFilter)
    )
  }, [tasks, periodFilter])

  const filteredTasks = useMemo(() => {
    const source = periodTasks

    if (filter === "all") {
      return source
    }

    return source.filter((task) => task.status === filter)
  }, [periodTasks, filter])

  const pendingCount = periodTasks.filter(
    (task) => task.status === "pending"
  ).length

  const acceptedCount = periodTasks.filter(
    (task) => task.status === "accepted"
  ).length

  const inProgressCount = periodTasks.filter(
    (task) => task.status === "in_progress"
  ).length

  const completedCount = periodTasks.filter(
    (task) => task.status === "completed"
  ).length

  const urgentCount = periodTasks.filter(
    (task) => task.priority === "urgent"
  ).length

  const openTasks = periodTasks.filter(
    (task) => task.status !== "completed"
  ).length

  const totalWorkedHours = periodTasks.reduce(
    (sum, task) => sum + getTaskHours(task),
    0
  )

  const totalPayable = periodTasks.reduce(
    (sum, task) => sum + getTaskAmount(task),
    0
  )

  const missingTimeCount = periodTasks.filter(
    (task) =>
      !safeText(task.actual_start_time) ||
      !safeText(task.actual_end_time)
  ).length

  const missingRateCount = periodTasks.filter(
    (task) => toNumber(task.hourly_rate) === 0
  ).length

  const groupedTasks = groupTasksByDate(filteredTasks)

  const cleanerSummary = useMemo(() => {
    const summary = periodTasks.reduce<
      Record<string, CleanerSummary>
    >((acc, task) => {
      const cleaner =
        safeText(task.cleaner_name) || "Unassigned"

      if (!acc[cleaner]) {
        acc[cleaner] = {
          cleaner,
          hours: 0,
          amount: 0,
          tasks: 0,
          completed: 0,
          open: 0,
          missingTime: 0,
          missingRate: 0,
        }
      }

      acc[cleaner].hours += getTaskHours(task)
      acc[cleaner].amount += getTaskAmount(task)
      acc[cleaner].tasks += 1

      if (task.status === "completed") {
        acc[cleaner].completed += 1
      } else {
        acc[cleaner].open += 1
      }

      if (
        !safeText(task.actual_start_time) ||
        !safeText(task.actual_end_time)
      ) {
        acc[cleaner].missingTime += 1
      }

      if (toNumber(task.hourly_rate) === 0) {
        acc[cleaner].missingRate += 1
      }

      return acc
    }, {})

    return Object.values(summary).sort(
      (a, b) => b.amount - a.amount
    )
  }, [periodTasks])

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-5 md:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white rounded-[32px] p-7 md:p-8 shadow-2xl">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
            <div>
              <div className="uppercase tracking-[0.3em] text-xs text-white/50 mb-4">
                AI CO-HOST
              </div>

              <h1 className="text-4xl md:text-5xl font-black mb-4">
                Cleaning Operations
              </h1>

              <p className="text-white/60 max-w-2xl leading-relaxed">
                Manage manual turnovers, assign cleaners, track
                checkout and next check-in windows, and estimate
                cleaner payments based on actual working time.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/10 border border-white/10 rounded-3xl p-5">
                <div className="text-white/50 text-sm mb-2">
                  Open
                </div>
                <div className="text-3xl font-bold">
                  {openTasks}
                </div>
              </div>

              <div className="bg-white/10 border border-white/10 rounded-3xl p-5">
                <div className="text-white/50 text-sm mb-2">
                  Hours
                </div>
                <div className="text-3xl font-bold">
                  {totalWorkedHours.toFixed(1)}
                </div>
              </div>

              <div className="bg-green-500/15 border border-green-400/20 rounded-3xl p-5">
                <div className="text-green-100 text-sm mb-2">
                  Payable
                </div>
                <div className="text-3xl font-bold text-green-100">
                  €{totalPayable.toFixed(2)}
                </div>
              </div>

              <div className="bg-red-500/15 border border-red-400/20 rounded-3xl p-5">
                <div className="text-red-100 text-sm mb-2">
                  Missing Data
                </div>
                <div className="text-3xl font-bold text-red-100">
                  {missingTimeCount + missingRateCount}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {periodOptions.map((period) => (
            <button
              key={period}
              onClick={() => setPeriodFilter(period)}
              className={`px-5 py-3 rounded-2xl capitalize transition ${
                periodFilter === period
                  ? "bg-black text-white"
                  : "bg-white border border-gray-200"
              }`}
            >
              {period.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="grid xl:grid-cols-[1.15fr_0.85fr] gap-8">
          <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-xl border border-black/5">
            <div className="mb-8">
              <h2 className="text-3xl font-black mb-3">
                ➕ Create Manual Cleaning Task
              </h2>

              <p className="text-gray-500 leading-relaxed">
                Create a manual cleaning task for a turnover. Use the
                check-out and next check-in fields to understand the
                available window, then assign a cleaner and planned
                cleaning time.
              </p>
            </div>

            <div className="space-y-8">
              <section className="bg-gray-50 rounded-[28px] p-5 md:p-6 border border-gray-100">
                <SectionTitle
                  number="1"
                  title="Property"
                  description="Choose the property or enter the property name for this cleaning task."
                />

                <FieldLabel
                  title="Property name"
                  description="Example: Maltese Maisonette"
                />

                <input
                  value={propertyName}
                  onChange={(event) =>
                    setPropertyName(event.target.value)
                  }
                  placeholder="Maltese Maisonette"
                  className="w-full border border-gray-200 rounded-2xl p-4 bg-white"
                />
              </section>

              <section className="bg-gray-50 rounded-[28px] p-5 md:p-6 border border-gray-100">
                <SectionTitle
                  number="2"
                  title="Guest Turnover Window"
                  description="Enter the previous guest check-out and the next guest check-in."
                />

                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div>
                    <FieldLabel
                      title="Guest check-out date"
                      description="Date the previous guest leaves."
                    />

                    <input
                      type="date"
                      value={checkoutDate}
                      onChange={(event) =>
                        setCheckoutDate(event.target.value)
                      }
                      className="w-full border border-gray-200 rounded-2xl p-4 bg-white"
                    />
                  </div>

                  <div>
                    <FieldLabel
                      title="Guest check-out time"
                      description="Usually around 10:00."
                    />

                    <input
                      type="time"
                      value={checkoutTime}
                      onChange={(event) =>
                        setCheckoutTime(event.target.value)
                      }
                      className="w-full border border-gray-200 rounded-2xl p-4 bg-white"
                    />
                  </div>

                  <div>
                    <FieldLabel
                      title="Next check-in date"
                      description="Date the next guest arrives."
                    />

                    <input
                      type="date"
                      value={nextCheckinDate}
                      onChange={(event) =>
                        setNextCheckinDate(event.target.value)
                      }
                      className="w-full border border-gray-200 rounded-2xl p-4 bg-white"
                    />
                  </div>

                  <div>
                    <FieldLabel
                      title="Next check-in time"
                      description="Usually around 15:00."
                    />

                    <input
                      type="time"
                      value={nextCheckinTime}
                      onChange={(event) =>
                        setNextCheckinTime(event.target.value)
                      }
                      className="w-full border border-gray-200 rounded-2xl p-4 bg-white"
                    />
                  </div>
                </div>
              </section>

              <section className="bg-gray-50 rounded-[28px] p-5 md:p-6 border border-gray-100">
                <SectionTitle
                  number="3"
                  title="Cleaning Schedule"
                  description="Set the day and planned time when the cleaner should perform the job."
                />

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <FieldLabel
                      title="Cleaning date"
                      description="The day the cleaner should go to the property."
                    />

                    <input
                      type="date"
                      value={cleaningDate}
                      onChange={(event) =>
                        setCleaningDate(event.target.value)
                      }
                      className="w-full border border-gray-200 rounded-2xl p-4 bg-white"
                    />
                  </div>

                  <div>
                    <FieldLabel
                      title="Planned start time"
                      description="Expected cleaning start."
                    />

                    <input
                      type="time"
                      value={plannedStartTime}
                      onChange={(event) =>
                        setPlannedStartTime(event.target.value)
                      }
                      className="w-full border border-gray-200 rounded-2xl p-4 bg-white"
                    />
                  </div>

                  <div>
                    <FieldLabel
                      title="Planned end time"
                      description="Expected cleaning finish."
                    />

                    <input
                      type="time"
                      value={plannedEndTime}
                      onChange={(event) =>
                        setPlannedEndTime(event.target.value)
                      }
                      className="w-full border border-gray-200 rounded-2xl p-4 bg-white"
                    />
                  </div>
                </div>
              </section>

              <section className="bg-gray-50 rounded-[28px] p-5 md:p-6 border border-gray-100">
                <SectionTitle
                  number="4"
                  title="Cleaner Assignment & Pay"
                  description="Assign the cleaner and define the agreed hourly rate."
                />

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <FieldLabel
                      title="Cleaner name"
                      description="Example: Luca, Maria, Joseph."
                    />

                    <input
                      value={cleanerName}
                      onChange={(event) =>
                        setCleanerName(event.target.value)
                      }
                      placeholder="Cleaner name"
                      className="w-full border border-gray-200 rounded-2xl p-4 bg-white"
                    />
                  </div>

                  <div>
                    <FieldLabel
                      title="Cleaner contact"
                      description="Phone or WhatsApp number."
                    />

                    <input
                      value={cleanerContact}
                      onChange={(event) =>
                        setCleanerContact(event.target.value)
                      }
                      placeholder="+356..."
                      className="w-full border border-gray-200 rounded-2xl p-4 bg-white"
                    />
                  </div>

                  <div>
                    <FieldLabel
                      title="Hourly rate"
                      description="Agreed pay per hour in EUR."
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={hourlyRate}
                      onChange={(event) =>
                        setHourlyRate(event.target.value)
                      }
                      placeholder="10"
                      className="w-full border border-gray-200 rounded-2xl p-4 bg-white"
                    />
                  </div>
                </div>
              </section>

              <div className="flex justify-end">
                <button
                  onClick={createTask}
                  disabled={saving}
                  className="bg-black text-white rounded-2xl px-8 py-4 font-bold disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Cleaning Task"}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-6 md:p-7 shadow-xl border border-black/5">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  💶 Cleaner Payment Summary
                </h2>

                <p className="text-gray-500">
                  Totals for the selected period.
                </p>
              </div>

              <div className="text-right">
                <div className="text-sm text-gray-500">
                  Total
                </div>

                <div className="text-2xl font-black">
                  €{totalPayable.toFixed(2)}
                </div>

                <div className="text-xs text-gray-400">
                  {totalWorkedHours.toFixed(1)}h
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {cleanerSummary.map((item) => (
                <div
                  key={item.cleaner}
                  className="bg-gray-50 rounded-3xl p-5"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="font-bold text-lg">
                        {item.cleaner}
                      </div>

                      <div className="text-sm text-gray-500">
                        {item.tasks} task
                        {item.tasks === 1 ? "" : "s"} ·{" "}
                        {item.completed} completed · {item.open} open
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold">
                        €{item.amount.toFixed(2)}
                      </div>

                      <div className="text-sm text-gray-500">
                        {item.hours.toFixed(1)}h
                      </div>
                    </div>
                  </div>

                  {(item.missingTime > 0 ||
                    item.missingRate > 0) && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.missingTime > 0 && (
                        <span className="bg-orange-100 text-orange-700 rounded-2xl px-3 py-2 text-xs font-semibold">
                          {item.missingTime} missing time
                        </span>
                      )}

                      {item.missingRate > 0 && (
                        <span className="bg-red-100 text-red-700 rounded-2xl px-3 py-2 text-xs font-semibold">
                          {item.missingRate} missing rate
                        </span>
                      )}
                    </div>
                  )}

                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black"
                      style={{
                        width: `${Math.min(
                          100,
                          item.hours * 10
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}

              {cleanerSummary.length === 0 && (
                <div className="bg-gray-50 rounded-3xl p-8 text-center text-gray-500">
                  No cleaner payment data yet
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-5 shadow border border-black/5">
            <div className="text-gray-500 text-sm mb-2">
              Pending
            </div>

            <div className="text-3xl font-bold">
              {pendingCount}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow border border-black/5">
            <div className="text-gray-500 text-sm mb-2">
              Accepted
            </div>

            <div className="text-3xl font-bold">
              {acceptedCount}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow border border-black/5">
            <div className="text-gray-500 text-sm mb-2">
              Completed
            </div>

            <div className="text-3xl font-bold">
              {completedCount}
            </div>
          </div>

          <div className="bg-red-50 rounded-3xl p-5 shadow border border-red-100">
            <div className="text-red-500 text-sm mb-2">
              Urgent
            </div>

            <div className="text-3xl font-bold text-red-600">
              {urgentCount}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-5 py-3 rounded-2xl capitalize transition ${
                filter === status
                  ? "bg-black text-white"
                  : "bg-white border border-gray-200"
              }`}
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[32px] p-6 md:p-7 shadow-xl border border-black/5">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                🗓️ Turnover Overview
              </h2>

              <p className="text-gray-500">
                Manual operational overview of checkout, cleaning,
                cleaner assignment and next check-in.
              </p>
            </div>

            <a
              href="/dashboard/cleaning/mobile"
              className="bg-black text-white rounded-2xl px-5 py-3 font-semibold"
            >
              Open Cleaner Mobile
            </a>
          </div>

          {loading && (
            <div className="bg-gray-50 rounded-3xl p-6">
              Loading cleaning tasks...
            </div>
          )}

          {!loading &&
            Object.entries(groupedTasks).map(([date, dateTasks]) => (
              <div key={date} className="mb-8 last:mb-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-black text-white rounded-2xl px-4 py-2 font-semibold">
                    {date}
                  </div>

                  <div className="text-gray-400 text-sm">
                    {dateTasks.length} task
                    {dateTasks.length === 1 ? "" : "s"}
                  </div>
                </div>

                <div className="space-y-5">
                  {dateTasks.map((task) => {
                    const progress = getChecklistProgress(task)
                    const draft =
                      drafts[task.id] || createDraftFromTask(task)
                    const draftHours = getDraftHours(draft)
                    const draftAmount = getDraftAmount(draft)
                    const currency = task.currency || "EUR"
                    const warnings = getTaskWarnings(task)

                    return (
                      <div
                        key={task.id}
                        className="border border-gray-100 rounded-[28px] p-5 md:p-6"
                      >
                        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                          <div className="flex-1 space-y-5">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                              <div>
                                <div className="text-sm text-gray-500 mb-1">
                                  Property
                                </div>

                                <div className="text-2xl font-bold">
                                  {task.property_name ||
                                    "Unknown Property"}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <span
                                  className={`px-4 py-2 rounded-2xl text-sm font-semibold ${
                                    task.priority === "urgent"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-blue-100 text-blue-700"
                                  }`}
                                >
                                  {task.priority || "normal"}
                                </span>

                                <StatusBadge value={task.status} />

                                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-2xl text-sm font-semibold">
                                  Checklist {progress.completed}/
                                  {progress.total}
                                </span>
                              </div>
                            </div>

                            {warnings.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {warnings.map((warning) => (
                                  <span
                                    key={warning}
                                    className="bg-orange-100 text-orange-700 rounded-2xl px-3 py-2 text-xs font-semibold"
                                  >
                                    ⚠️ {warning}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="grid md:grid-cols-4 gap-3">
                              <div className="bg-gray-50 rounded-2xl p-4">
                                <div className="text-xs text-gray-400 mb-1">
                                  Guest Check-out
                                </div>

                                <div className="font-semibold">
                                  {task.checkout_date ||
                                    task.cleaning_date ||
                                    "—"}
                                </div>

                                <div className="text-sm text-gray-500">
                                  {task.checkout_time || "—"}
                                </div>
                              </div>

                              <div className="bg-gray-50 rounded-2xl p-4">
                                <div className="text-xs text-gray-400 mb-1">
                                  Planned Cleaning
                                </div>

                                <div className="font-semibold">
                                  {task.planned_start_time || "—"}{" "}
                                  → {task.planned_end_time || "—"}
                                </div>

                                <div className="text-sm text-gray-500">
                                  {task.cleaning_date || "—"}
                                </div>
                              </div>

                              <div className="bg-gray-50 rounded-2xl p-4">
                                <div className="text-xs text-gray-400 mb-1">
                                  Next Guest Check-in
                                </div>

                                <div className="font-semibold">
                                  {task.next_checkin_date || "—"}
                                </div>

                                <div className="text-sm text-gray-500">
                                  {task.next_checkin_time || "—"}
                                </div>
                              </div>

                              <div className="bg-gray-50 rounded-2xl p-4">
                                <div className="text-xs text-gray-400 mb-1">
                                  Draft Pay Estimate
                                </div>

                                <div className="font-semibold">
                                  {formatMoney(
                                    draftAmount,
                                    currency
                                  )}
                                </div>

                                <div className="text-sm text-gray-500">
                                  {draftHours.toFixed(1)}h x €
                                  {toNumber(
                                    draft.hourly_rate
                                  ).toFixed(2)}
                                </div>
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 bg-gray-50 rounded-3xl p-4 border border-gray-100">
                              <div>
                                <FieldLabel title="Cleaner name" />
                                <input
                                  value={draft.cleaner_name}
                                  placeholder="Cleaner name"
                                  onChange={(event) =>
                                    updateDraft(
                                      task.id,
                                      "cleaner_name",
                                      event.target.value
                                    )
                                  }
                                  className="w-full border border-gray-200 rounded-2xl p-3 bg-white"
                                />
                              </div>

                              <div>
                                <FieldLabel title="Cleaner contact" />
                                <input
                                  value={draft.cleaner_contact}
                                  placeholder="Phone / WhatsApp"
                                  onChange={(event) =>
                                    updateDraft(
                                      task.id,
                                      "cleaner_contact",
                                      event.target.value
                                    )
                                  }
                                  className="w-full border border-gray-200 rounded-2xl p-3 bg-white"
                                />
                              </div>

                              <div>
                                <FieldLabel title="Hourly rate" />
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={draft.hourly_rate}
                                  placeholder="10"
                                  onChange={(event) =>
                                    updateDraft(
                                      task.id,
                                      "hourly_rate",
                                      event.target.value
                                    )
                                  }
                                  className="w-full border border-gray-200 rounded-2xl p-3 bg-white"
                                />
                              </div>

                              <div>
                                <FieldLabel title="Actual start" />
                                <input
                                  type="time"
                                  value={draft.actual_start_time}
                                  onChange={(event) =>
                                    updateDraft(
                                      task.id,
                                      "actual_start_time",
                                      event.target.value
                                    )
                                  }
                                  className="w-full border border-gray-200 rounded-2xl p-3 bg-white"
                                />
                              </div>

                              <div>
                                <FieldLabel title="Actual end" />
                                <input
                                  type="time"
                                  value={draft.actual_end_time}
                                  onChange={(event) =>
                                    updateDraft(
                                      task.id,
                                      "actual_end_time",
                                      event.target.value
                                    )
                                  }
                                  className="w-full border border-gray-200 rounded-2xl p-3 bg-white"
                                />
                              </div>

                              <div>
                                <FieldLabel title="Extra fee" />
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={draft.extra_fee}
                                  placeholder="0"
                                  onChange={(event) =>
                                    updateDraft(
                                      task.id,
                                      "extra_fee",
                                      event.target.value
                                    )
                                  }
                                  className="w-full border border-gray-200 rounded-2xl p-3 bg-white"
                                />
                              </div>
                            </div>

                            <div>
                              <div className="font-semibold mb-4">
                                Cleaning Checklist
                              </div>

                              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                                {Object.entries(
                                  progress.checklist
                                ).map(([key, value]) => (
                                  <label
                                    key={key}
                                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
                                      value
                                        ? "bg-green-50 border border-green-100"
                                        : "bg-gray-50"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={value}
                                      onChange={() =>
                                        toggleChecklistItem(
                                          task,
                                          key as keyof Checklist
                                        )
                                      }
                                    />

                                    <span className="capitalize">
                                      {key.replace("_", " ")}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div>
                              <FieldLabel title="Cleaning notes" />

                              <textarea
                                value={draft.notes}
                                placeholder="Cleaning notes..."
                                onChange={(event) =>
                                  updateDraft(
                                    task.id,
                                    "notes",
                                    event.target.value
                                  )
                                }
                                className="w-full border border-gray-200 rounded-2xl p-4 min-h-[100px]"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 min-w-[220px]">
                            <button
                              onClick={() => saveTaskDraft(task)}
                              className="bg-black hover:bg-zinc-800 text-white rounded-2xl px-5 py-3 font-bold transition"
                            >
                              Save Task Details
                            </button>

                            <button
                              onClick={() =>
                                updateStatus(task, "accepted")
                              }
                              className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl px-5 py-3 transition"
                            >
                              Accept Task
                            </button>

                            <button
                              onClick={() =>
                                updateStatus(
                                  task,
                                  "in_progress"
                                )
                              }
                              className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-5 py-3 transition"
                            >
                              Start Cleaning
                            </button>

                            <button
                              onClick={() =>
                                updateStatus(task, "completed")
                              }
                              className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-5 py-3 transition"
                            >
                              Mark Completed
                            </button>

                            <button
                              onClick={() =>
                                updateTask(task.id, {
                                  priority:
                                    task.priority === "urgent"
                                      ? "normal"
                                      : "urgent",
                                })
                              }
                              className="bg-red-500 hover:bg-red-600 text-white rounded-2xl px-5 py-3 transition"
                            >
                              Toggle Urgent
                            </button>

                            <button
                              onClick={() => deleteTask(task.id)}
                              className="bg-gray-800 hover:bg-black text-white rounded-2xl px-5 py-3 transition"
                            >
                              Delete Task
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

          {!loading && filteredTasks.length === 0 && (
            <div className="bg-gray-50 rounded-[28px] p-10 text-center text-gray-500">
              No cleaning tasks found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}