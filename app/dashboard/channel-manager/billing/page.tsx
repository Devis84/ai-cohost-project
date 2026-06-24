"use client"

import { useEffect, useState } from "react"

type Plan = {
  id: string
  name: string
  price: number
  features: string[]
}

export default function BillingDashboard() {
  const [billingEnabled, setBillingEnabled] =
    useState(false)

  const [plans, setPlans] = useState<Plan[]>([])

  const [currentPlan, setCurrentPlan] =
    useState("free")

  const [loading, setLoading] =
    useState(true)

  async function loadBilling() {
    try {
      setLoading(true)

      const res = await fetch(
        "/api/billing/status"
      )

      const data = await res.json()

      setBillingEnabled(
        data?.billing?.enabled || false
      )

      setCurrentPlan(
        data?.billing?.currentPlan || "free"
      )

      setPlans(data?.plans || [])

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBilling()
  }, [])

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
                Billing Dashboard
              </h1>

              <p className="text-white/60 max-w-2xl">
                Manage subscriptions,
                SaaS plans and future
                Stripe integrations.
              </p>

            </div>

            <div className="grid grid-cols-2 gap-4 min-w-[320px]">

              <div className="bg-white/10 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">

                <div className="text-white/50 text-sm mb-2">
                  Billing
                </div>

                <div className="text-3xl font-bold">
                  {billingEnabled
                    ? "ON"
                    : "OFF"}
                </div>

              </div>

              <div className="bg-white/10 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">

                <div className="text-white/50 text-sm mb-2">
                  Current Plan
                </div>

                <div className="text-2xl font-bold capitalize">
                  {currentPlan}
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* BILLING STATUS */}

        <div className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5 mb-8">

          <h2 className="text-2xl font-bold mb-6">
            💳 Billing Status
          </h2>

          {loading ? (

            <div className="text-gray-500">
              Loading billing data...
            </div>

          ) : (

            <div className="space-y-4">

              <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-5">

                <div>
                  <div className="font-semibold">
                    Subscription System
                  </div>

                  <div className="text-sm text-gray-500">
                    Enable or disable SaaS payments
                  </div>
                </div>

                <div
                  className={`px-4 py-2 rounded-2xl font-semibold ${
                    billingEnabled
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {billingEnabled
                    ? "ACTIVE"
                    : "DISABLED"}
                </div>

              </div>

              <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-5">

                <div>
                  <div className="font-semibold">
                    Current Plan
                  </div>

                  <div className="text-sm text-gray-500">
                    Active subscription tier
                  </div>
                </div>

                <div className="bg-black text-white px-4 py-2 rounded-2xl capitalize font-semibold">
                  {currentPlan}
                </div>

              </div>

            </div>

          )}

        </div>

        {/* PLANS */}

        <div className="grid lg:grid-cols-3 gap-6">

          {plans.map((plan) => (

            <div
              key={plan.id}
              className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5"
            >

              <div className="mb-6">

                <h2 className="text-3xl font-bold mb-2">
                  {plan.name}
                </h2>

                <div className="text-5xl font-bold">
                  €{plan.price}
                  <span className="text-lg text-gray-500">
                    /mo
                  </span>
                </div>

              </div>

              <div className="space-y-3 mb-8">

                {plan.features.map(
                  (feature, i) => (

                    <div
                      key={i}
                      className="flex items-start gap-3"
                    >

                      <div>
                        ✅
                      </div>

                      <div className="text-gray-700">
                        {feature}
                      </div>

                    </div>
                  )
                )}

              </div>

              <button
                className={`w-full rounded-2xl px-5 py-4 font-semibold transition ${
                  currentPlan === plan.id
                    ? "bg-green-600 text-white"
                    : "bg-black text-white hover:opacity-90"
                }`}
              >
                {currentPlan === plan.id
                  ? "Current Plan"
                  : "Select Plan"}
              </button>

            </div>
          ))}

        </div>

        {/* STRIPE */}

        <div className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5 mt-8">

          <h2 className="text-2xl font-bold mb-6">
            ⚡ Stripe Integration
          </h2>

          <div className="space-y-4">

            <div className="bg-gray-50 rounded-2xl p-5 flex items-center justify-between">

              <div>
                <div className="font-semibold">
                  Stripe Status
                </div>

                <div className="text-sm text-gray-500">
                  Payment gateway integration
                </div>
              </div>

              <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-2xl font-semibold">
                NOT CONNECTED
              </div>

            </div>

            <div className="text-gray-500 text-sm leading-relaxed">
              Stripe integration will handle:
              subscriptions, invoices,
              recurring payments,
              checkout sessions and
              customer billing management.
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}