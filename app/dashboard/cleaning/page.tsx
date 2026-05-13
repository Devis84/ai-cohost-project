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
  property_id?: string
  property_name?: string
  cleaning_date?: string
  checkout_time?: string
  cleaner_name?: string
  cleaner_contact?: string
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

export default function CleaningDashboard() {
  const [tasks, setTasks] = useState<CleaningTask[]>([])
  const [loading, setLoading] = useState(true)

  const [propertyName, setPropertyName] = useState("")
  const [cleaningDate, setCleaningDate] = useState("")
  const [checkoutTime, setCheckoutTime] = useState("")
  const [filter, setFilter] = useState("all")

  async function fetchTasks() {
    try {
      setLoading(true)

      const res = await fetch("/api/cleaning-tasks")
      const data = await res.json()

      setTasks(data.tasks || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  async function createTask() {
    if (!propertyName || !cleaningDate) {
      alert("Property name and date are required")
      return
    }

    try {
      const res = await fetch("/api/cleaning-tasks", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          property_name: propertyName,
          cleaning_date: cleaningDate,
          checkout_time: checkoutTime,
          status: "pending",
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
      setCheckoutTime("")

      fetchTasks()
    } catch (err) {
      console.error(err)
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
      }

      fetchTasks()
    } catch (err) {
      console.error(err)
    }
  }

  async function deleteTask(id: string) {
    const confirmed = confirm(
      "Delete this cleaning task?"
    )

    if (!confirmed) return

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

      fetchTasks()
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

  const filteredTasks = useMemo(() => {
    if (filter === "all") {
      return tasks
    }

    return tasks.filter(
      (task) => task.status === filter
    )
  }, [tasks, filter])

  const pendingCount =
    tasks.filter(
      (task) => task.status === "pending"
    ).length

  const completedCount =
    tasks.filter(
      (task) => task.status === "completed"
    ).length

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6">

      <div className="max-w-7xl mx-auto">

        {/* HERO */}

        <div className="bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white rounded-[32px] p-8 shadow-2xl mb-8">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            <div>

              <div className="uppercase tracking-[0.3em] text-xs text-white/50 mb-4">
                AI CO-HOST
              </div>

              <h1 className="text-4xl font-bold mb-4">
                Cleaning Dashboard
              </h1>

              <p className="text-white/60 max-w-2xl">
                Manage cleaning operations,
                assign cleaners and monitor
                cleaning status across properties.
              </p>

              <div className="mt-6">

                <a
                  href="/dashboard/cleaning/mobile"
                  className="inline-flex items-center justify-center bg-white text-black rounded-2xl px-5 py-3 font-semibold hover:opacity-90 transition"
                >
                  📱 Open Cleaner App
                </a>

              </div>

            </div>

            <div className="grid grid-cols-2 gap-4 min-w-[280px]">

              <div className="bg-white/10 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">

                <div className="text-white/50 text-sm mb-2">
                  Pending
                </div>

                <div className="text-3xl font-bold">
                  {pendingCount}
                </div>

              </div>

              <div className="bg-white/10 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">

                <div className="text-white/50 text-sm mb-2">
                  Completed
                </div>

                <div className="text-3xl font-bold">
                  {completedCount}
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* CREATE TASK */}

        <div className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5 mb-8">

          <h2 className="text-2xl font-bold mb-6">
            ➕ Create Cleaning Task
          </h2>

          <div className="grid lg:grid-cols-4 gap-4">

            <input
              value={propertyName}
              onChange={(e) =>
                setPropertyName(e.target.value)
              }
              placeholder="Property name"
              className="border border-gray-200 rounded-2xl p-4"
            />

            <input
              type="date"
              value={cleaningDate}
              onChange={(e) =>
                setCleaningDate(e.target.value)
              }
              className="border border-gray-200 rounded-2xl p-4"
            />

            <input
              value={checkoutTime}
              onChange={(e) =>
                setCheckoutTime(e.target.value)
              }
              placeholder="Checkout time"
              className="border border-gray-200 rounded-2xl p-4"
            />

            <button
              onClick={createTask}
              className="bg-black text-white rounded-2xl px-6 py-4 font-semibold hover:opacity-90 transition"
            >
              Create Task
            </button>

          </div>

        </div>

        {/* FILTERS */}

        <div className="flex flex-wrap gap-3 mb-6">

          <button
            onClick={() => setFilter("all")}
            className={`px-5 py-3 rounded-2xl transition ${
              filter === "all"
                ? "bg-black text-white"
                : "bg-white border border-gray-200"
            }`}
          >
            All
          </button>

          <button
            onClick={() => setFilter("pending")}
            className={`px-5 py-3 rounded-2xl transition ${
              filter === "pending"
                ? "bg-orange-500 text-white"
                : "bg-white border border-gray-200"
            }`}
          >
            Pending
          </button>

          <button
            onClick={() => setFilter("completed")}
            className={`px-5 py-3 rounded-2xl transition ${
              filter === "completed"
                ? "bg-green-600 text-white"
                : "bg-white border border-gray-200"
            }`}
          >
            Completed
          </button>

        </div>

        {/* TASKS */}

        <div className="space-y-5">

          {loading && (
            <div className="bg-white rounded-3xl p-6 shadow">
              Loading cleaning tasks...
            </div>
          )}

          {!loading &&
            filteredTasks.map((task) => {

              const checklist = {
                ...defaultChecklist,
                ...(task.checklist || {}),
              }

              const checklistValues =
                Object.values(checklist)

              const completedChecklistItems =
                checklistValues.filter(Boolean).length

              const totalChecklistItems =
                checklistValues.length

              return (

                <div
                  key={task.id}
                  className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5"
                >

                  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-8">

                    {/* LEFT */}

                    <div className="space-y-5 flex-1">

                      <div>

                        <div className="text-sm text-gray-500 mb-1">
                          Property
                        </div>

                        <div className="text-2xl font-bold">
                          {task.property_name ||
                            "Unknown Property"}
                        </div>

                      </div>

                      <div className="flex flex-wrap gap-3">

                        <div className="bg-gray-100 px-4 py-2 rounded-2xl text-sm">
                          📅 {task.cleaning_date}
                        </div>

                        {task.checkout_time && (

                          <div className="bg-gray-100 px-4 py-2 rounded-2xl text-sm">
                            ⏰ {task.checkout_time}
                          </div>

                        )}

                        <div
                          className={`px-4 py-2 rounded-2xl text-sm font-semibold ${
                            task.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {task.status || "pending"}
                        </div>

                        <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-2xl text-sm font-semibold">
                          Checklist {
                            completedChecklistItems
                          }/{totalChecklistItems}
                        </div>

                      </div>

                      {/* CHECKLIST */}

                      <div>

                        <div className="font-semibold mb-4">
                          Cleaning Checklist
                        </div>

                        <div className="grid md:grid-cols-2 gap-3">

                          {Object.entries(checklist).map(
                            ([key, value]) => (

                              <label
                                key={key}
                                className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3"
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
                            )
                          )}

                        </div>

                      </div>

                      {/* NOTES */}

                      <textarea
                        defaultValue={task.notes || ""}
                        placeholder="Cleaning notes..."
                        onBlur={(e) =>
                          updateTask(task.id, {
                            notes: e.target.value,
                          })
                        }
                        className="w-full border border-gray-200 rounded-2xl p-4 min-h-[120px]"
                      />

                    </div>

                    {/* RIGHT */}

                    <div className="flex flex-col gap-3 min-w-[260px]">

                      <select
                        value={task.cleaner_name || ""}
                        onChange={(e) =>
                          updateTask(task.id, {
                            cleaner_name:
                              e.target.value,
                          })
                        }
                        className="border border-gray-200 rounded-2xl p-4"
                      >

                        <option value="">
                          Select cleaner
                        </option>

                        <option value="Mario">
                          Mario
                        </option>

                        <option value="Luigi">
                          Luigi
                        </option>

                        <option value="Anna">
                          Anna
                        </option>

                      </select>

                      <button
                        onClick={() =>
                          updateTask(task.id, {
                            status: "pending",
                          })
                        }
                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-5 py-3 transition"
                      >
                        Mark as Pending
                      </button>

                      <button
                        onClick={() =>
                          updateTask(task.id, {
                            status: "completed",
                          })
                        }
                        className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-5 py-3 transition"
                      >
                        Mark as Completed
                      </button>

                      <button
                        onClick={() =>
                          deleteTask(task.id)
                        }
                        className="bg-red-500 hover:bg-red-600 text-white rounded-2xl px-5 py-3 transition"
                      >
                        Delete Task
                      </button>

                    </div>

                  </div>

                </div>
              )
            })}

          {!loading &&
            filteredTasks.length === 0 && (

              <div className="bg-white rounded-[32px] p-10 text-center shadow-xl border border-black/5 text-gray-500">
                No cleaning tasks found
              </div>

            )}

        </div>

      </div>

    </div>
  )
}