export const BILLING_ENABLED =
  process.env.NEXT_PUBLIC_BILLING_ENABLED === "true"

export const BILLING_PROVIDER =
  process.env.NEXT_PUBLIC_BILLING_PROVIDER || "stripe"

export const BILLING_MODE =
  process.env.NEXT_PUBLIC_BILLING_MODE || "disabled"

export const billingPlans = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 29,
    currency: "EUR",
    features: [
      "1 property",
      "AI concierge",
      "Guest welcome page",
      "Basic cleaning tasks",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 79,
    currency: "EUR",
    features: [
      "Up to 5 properties",
      "AI concierge",
      "Advanced welcome book",
      "Cleaning module",
      "Guest conversations",
      "Priority support",
    ],
  },
  {
    id: "business",
    name: "Business",
    priceMonthly: 199,
    currency: "EUR",
    features: [
      "Unlimited properties",
      "AI concierge",
      "Cleaning workflows",
      "Team access",
      "Advanced analytics",
      "Future channel manager support",
    ],
  },
]

export function isBillingEnabled() {
  return BILLING_ENABLED
}

export function getBillingStatus() {
  if (!BILLING_ENABLED) {
    return {
      enabled: false,
      provider: null,
      mode: "disabled",
      message: "Billing is disabled",
    }
  }

  return {
    enabled: true,
    provider: BILLING_PROVIDER,
    mode: BILLING_MODE,
    message: "Billing is enabled",
  }
}

export function getPlans() {
  return billingPlans
}

export function canAccessPaidFeatures() {
  if (!BILLING_ENABLED) {
    return true
  }

  return false
}