 "use client"

import { useEffect, useMemo, useState } from "react"

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

  const filteredTasks = useMemo(() => {
    if (filter === "all") {
      return tasks
    }

    return tasks.filter(
      (task) => task.status === filter
    )
  }, [tasks, filter])

  const pendingCount = tasks.filter(
    (t) => t.status === "pending"
  ).length

  const completedCount = tasks.filter(
    (t) => t.status === "completed"
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
              className="bg-black text-white rounded-2xl px-6 py-4 font-semibold"
            >
              Create Task
            </button>
          </div>
        </div>

        {/* FILTERS */}

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-5 py-3 rounded-2xl ${
              filter === "all"
                ? "bg-black text-white"
                : "bg-white border border-gray-200"
            }`}
          >
            All
          </button>

          <button
            onClick={() => setFilter("pending")}
            className={`px-5 py-3 rounded-2xl ${
              filter === "pending"
                ? "bg-orange-500 text-white"
                : "bg-white border border-gray-200"
            }`}
          >
            Pending
          </button>

          <button
            onClick={() => setFilter("completed")}
            className={`px-5 py-3 rounded-2xl ${
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
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5"
              >
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                  {/* LEFT */}

                  <div className="space-y-3">
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
                    </div>

                    {task.notes && (
                      <div className="text-gray-600">
                        {task.notes}
                      </div>
                    )}
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
                  </div>
                </div>
              </div>
            ))}

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