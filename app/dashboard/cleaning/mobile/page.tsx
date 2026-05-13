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
  status?: string
  notes?: string
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

      const pendingTasks =
        (data.tasks || []).filter(
          (task: CleaningTask) =>
            task.status !== "completed"
        )

      setTasks(pendingTasks)
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
    const checklist =
      task.checklist ||
      defaultChecklist

    const updatedChecklist = {
      ...checklist,
      [key]:
        !checklist[key],
    }

    await updateTask(task.id, {
      checklist: updatedChecklist,
    })
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-4">

      <div className="max-w-xl mx-auto">

        {/* HEADER */}

        <div className="bg-black text-white rounded-[32px] p-6 shadow-2xl mb-6">

          <div className="uppercase tracking-[0.3em] text-xs text-white/50 mb-3">
            AI CO-HOST
          </div>

          <h1 className="text-3xl font-bold mb-3">
            Cleaner App
          </h1>

          <p className="text-white/60 text-sm leading-relaxed">
            Mobile cleaning workflow for
            cleaners and operational staff.
          </p>

        </div>

        {/* TASKS */}

        {loading && (
          <div className="bg-white rounded-[32px] p-6 shadow">
            Loading tasks...
          </div>
        )}

        {!loading && tasks.length === 0 && (
          <div className="bg-white rounded-[32px] p-10 text-center shadow text-gray-500">
            No active cleaning tasks
          </div>
        )}

        <div className="space-y-5">

          {tasks.map((task) => {
            const checklist =
              task.checklist ||
              defaultChecklist

            const completedItems =
              Object.values(
                checklist
              ).filter(Boolean).length

            const totalItems =
              Object.keys(
                checklist
              ).length

            const progress =
              Math.round(
                (completedItems /
                  totalItems) *
                  100
              )

            return (
              <div
                key={task.id}
                className="bg-white rounded-[32px] p-6 shadow-xl border border-black/5"
              >

                {/* PROPERTY */}

                <div className="mb-5">

                  <div className="text-sm text-gray-500 mb-1">
                    Property
                  </div>

                  <div className="text-2xl font-bold">
                    {task.property_name}
                  </div>

                </div>

                {/* INFO */}

                <div className="flex flex-wrap gap-3 mb-5">

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

                </div>

                {/* PROGRESS */}

                <div className="mb-6">

                  <div className="flex items-center justify-between mb-2">

                    <div className="font-semibold text-sm">
                      Progress
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
                        className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4"
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

                        <span className="capitalize">
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
                  className="w-full border border-gray-200 rounded-2xl p-4 min-h-[120px] mb-5"
                />

                {/* ACTIONS */}

                <div className="flex flex-col gap-3">

                  <button
                    onClick={() =>
                      updateTask(task.id, {
                        status:
                          "completed",
                      })
                    }
                    className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-5 py-4 font-semibold transition"
                  >
                    ✅ Mark as Completed
                  </button>

                  <button
                    onClick={() =>
                      updateTask(task.id, {
                        status:
                          "pending",
                      })
                    }
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-5 py-4 font-semibold transition"
                  >
                    🔄 Reopen Task
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