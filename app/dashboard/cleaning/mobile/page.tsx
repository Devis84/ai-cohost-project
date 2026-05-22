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

export default function CleanerMobilePage() {
  const [tasks, setTasks] =
    useState<CleaningTask[]>([])

  const [loading, setLoading] =
    useState(true)

  async function fetchTasks() {
    try {
      setLoading(true)

      const res = await fetch(
        "/api/cleaning-tasks"
      )

      const data = await res.json()

      const activeTasks =
        (data.tasks || []).filter(
          (task: CleaningTask) =>
            task.status !== "completed"
        )

      setTasks(activeTasks)
    } catch (err) {
      console.error(err)
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
      await fetch(
        "/api/cleaning-tasks",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            id,
            ...payload,
          }),
        }
      )

      fetchTasks()
    } catch (err) {
      console.error(err)
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
      [key]:
        !checklist[key],
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
      payload.assigned_at =
        new Date().toISOString()
    }

    if (status === "in_progress") {
      payload.started_at =
        new Date().toISOString()
    }

    if (status === "completed") {
      payload.completed_at =
        new Date().toISOString()
    }

    await updateTask(task.id, payload)
  }

  const urgentCount = useMemo(() => {
    return tasks.filter(
      (task) =>
        task.priority === "urgent"
    ).length
  }, [tasks])

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-10">

      {/* HEADER */}

      <div className="sticky top-0 z-20 bg-black text-white px-5 pt-6 pb-7 rounded-b-[32px] shadow-2xl">

        <div className="uppercase tracking-[0.3em] text-xs text-white/50 mb-3">
          AI CO-HOST
        </div>

        <div className="flex items-center justify-between gap-4">

          <div>

            <h1 className="text-3xl font-bold mb-2">
              Cleaner App
            </h1>

            <p className="text-white/60 text-sm">
              Mobile cleaning workflow
            </p>

          </div>

          <div className="bg-white/10 rounded-3xl px-5 py-4 text-center min-w-[90px]">

            <div className="text-white/50 text-xs mb-1">
              Active
            </div>

            <div className="text-2xl font-bold">
              {tasks.length}
            </div>

          </div>

        </div>

        {urgentCount > 0 && (

          <div className="mt-5 bg-red-500/20 border border-red-500/20 rounded-2xl px-4 py-3 text-sm text-red-100">

            🔴 {urgentCount} urgent cleaning task
            {urgentCount > 1 ? "s" : ""}

          </div>

        )}

      </div>

      {/* CONTENT */}

      <div className="max-w-xl mx-auto px-4 pt-6">

        {loading && (

          <div className="bg-white rounded-[32px] p-6 shadow-xl">

            Loading tasks...

          </div>

        )}

        {!loading &&
          tasks.length === 0 && (

            <div className="bg-white rounded-[32px] p-10 text-center shadow-xl text-gray-500">

              No active cleaning tasks

            </div>

          )}

        <div className="space-y-5">

          {tasks.map((task) => {

            const checklist = {
              ...defaultChecklist,
              ...(task.checklist || {}),
            }

            const completedItems =
              Object.values(
                checklist
              ).filter(Boolean).length

            const totalItems =
              Object.keys(checklist)
                .length

            const progress =
              Math.round(
                (completedItems /
                  totalItems) *
                  100
              )

            return (

              <div
                key={task.id}
                className="bg-white rounded-[32px] p-5 shadow-xl border border-black/5"
              >

                {/* PROPERTY */}

                <div className="mb-5">

                  <div className="flex items-start justify-between gap-3 mb-3">

                    <div>

                      <div className="text-sm text-gray-500 mb-1">
                        Property
                      </div>

                      <div className="text-2xl font-bold leading-tight">
                        {task.property_name}
                      </div>

                    </div>

                    <div
                      className={`px-4 py-2 rounded-2xl text-xs font-semibold ${
                        task.priority ===
                        "urgent"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >

                      {task.priority ||
                        "normal"}

                    </div>

                  </div>

                  <div className="flex flex-wrap gap-2">

                    <div className="bg-gray-100 px-4 py-2 rounded-2xl text-sm">
                      📅 {task.cleaning_date}
                    </div>

                    {task.checkout_time && (

                      <div className="bg-gray-100 px-4 py-2 rounded-2xl text-sm">
                        ⏰{" "}
                        {
                          task.checkout_time
                        }
                      </div>

                    )}

                    <div className="bg-black text-white px-4 py-2 rounded-2xl text-sm capitalize">

                      {task.status ||
                        "pending"}

                    </div>

                  </div>

                </div>

                {/* CLEANER */}

                {(task.cleaner_name ||
                  task.cleaner_contact) && (

                  <div className="bg-gray-50 rounded-2xl p-4 mb-5">

                    <div className="text-sm font-semibold mb-2">
                      Assigned Cleaner
                    </div>

                    {task.cleaner_name && (

                      <div className="text-sm mb-1">
                        👤{" "}
                        {
                          task.cleaner_name
                        }
                      </div>

                    )}

                    {task.cleaner_contact && (

                      <div className="text-sm">
                        📞{" "}
                        {
                          task.cleaner_contact
                        }
                      </div>

                    )}

                  </div>

                )}

                {/* PROGRESS */}

                <div className="mb-6">

                  <div className="flex items-center justify-between mb-2">

                    <div className="font-semibold text-sm">
                      Cleaning Progress
                    </div>

                    <div className="text-sm text-gray-500">
                      {progress}%
                    </div>

                  </div>

                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">

                    <div
                      className="h-full bg-black transition-all"
                      style={{
                        width: `${progress}%`,
                      }}
                    />

                  </div>

                </div>

                {/* CHECKLIST */}

                <div className="space-y-3 mb-6">

                  {Object.entries(
                    checklist
                  ).map(
                    ([key, value]) => (

                      <label
                        key={key}
                        className={`flex items-center gap-4 rounded-2xl p-4 transition ${
                          value
                            ? "bg-green-50 border border-green-100"
                            : "bg-gray-50"
                        }`}
                      >

                        <input
                          type="checkbox"
                          checked={value}
                          onChange={() =>
                            toggleChecklist(
                              task,
                              key as keyof Checklist
                            )
                          }
                          className="w-5 h-5"
                        />

                        <span className="capitalize font-medium">
                          {key.replace(
                            "_",
                            " "
                          )}
                        </span>

                      </label>

                    )
                  )}

                </div>

                {/* NOTES */}

                <textarea
                  placeholder="Cleaning notes..."
                  defaultValue={
                    task.notes || ""
                  }
                  onBlur={(e) =>
                    updateTask(task.id, {
                      notes:
                        e.target.value,
                    })
                  }
                  className="w-full border border-gray-200 rounded-2xl p-4 min-h-[120px] mb-6"
                />

                {/* ACTIONS */}

                <div className="flex flex-col gap-3">

                  {task.status ===
                    "pending" && (

                    <button
                      onClick={() =>
                        updateStatus(
                          task,
                          "accepted"
                        )
                      }
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl px-5 py-4 font-semibold transition"
                    >
                      👍 Accept Task
                    </button>

                  )}

                  {(task.status ===
                    "accepted" ||
                    task.status ===
                      "pending") && (

                    <button
                      onClick={() =>
                        updateStatus(
                          task,
                          "in_progress"
                        )
                      }
                      className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-5 py-4 font-semibold transition"
                    >
                      🧹 Start Cleaning
                    </button>

                  )}

                  <button
                    onClick={() =>
                      updateStatus(
                        task,
                        "completed"
                      )
                    }
                    className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-5 py-4 font-semibold transition"
                  >
                    ✅ Mark as Completed
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