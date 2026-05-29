export type EscalationResult = {
  priority: "normal" | "medium" | "high"
  requires_host: boolean
  issue_detected: string | null
  issue_type: string | null
}

export function detectEscalation(
  message: string
): EscalationResult {
  const text = message.toLowerCase()

  const emergencyKeywords = [
    "emergency",
    "fire",
    "gas",
    "leak",
    "flood",
    "police",
    "ambulance",
    "hospital",
    "danger",
    "unsafe",
    "locked out",
    "can't enter",
    "cannot enter",
    "cannot access",
    "no access",
    "door won't open",
    "door does not open",
  ]

  const complaintKeywords = [
    "refund",
    "dirty",
    "not clean",
    "complaint",
    "angry",
    "unacceptable",
    "broken",
    "not working",
    "mold",
    "smell",
    "noise",
    "terrible",
    "disappointed",
    "bad experience",
    "cockroach",
    "insects",
    "bugs",
  ]

  const maintenanceKeywords = [
    "air conditioning",
    "ac not working",
    "wifi not working",
    "internet not working",
    "hot water",
    "boiler",
    "electricity",
    "power",
    "water",
    "toilet",
    "shower",
    "washing machine",
    "fridge",
  ]

  const emergency = emergencyKeywords.some((keyword) =>
    text.includes(keyword)
  )

  if (emergency) {
    return {
      priority: "high",
      requires_host: true,
      issue_detected: "urgent_guest_issue",
      issue_type: "emergency",
    }
  }

  const complaint = complaintKeywords.some((keyword) =>
    text.includes(keyword)
  )

  if (complaint) {
    return {
      priority: "medium",
      requires_host: true,
      issue_detected: "guest_complaint",
      issue_type: "complaint",
    }
  }

  const maintenance = maintenanceKeywords.some((keyword) =>
    text.includes(keyword)
  )

  if (maintenance) {
    return {
      priority: "medium",
      requires_host: true,
      issue_detected: "maintenance_request",
      issue_type: "maintenance",
    }
  }

  return {
    priority: "normal",
    requires_host: false,
    issue_detected: null,
    issue_type: null,
  }
}