import type { ChatPropertyRecord } from "@/lib/ai/engine/property";

function safeText(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const clean = value.trim();
  return clean || fallback;
}

export function buildStayContextSummary({
  property,
  guestName,
  channel,
}: {
  property: ChatPropertyRecord;
  guestName?: string;
  channel: string;
}) {
  const propertyName = safeText(property.property_name, "the property");
  const city = safeText(property.city);
  const country = safeText(property.country);
  const location = [city, country].filter(Boolean).join(", ");

  return {
    propertyName,
    location,
    guestName: safeText(guestName, "Guest"),
    channel,
    summary: [
      `Property: ${propertyName}`,
      location ? `Location: ${location}` : "",
      guestName ? `Guest: ${guestName}` : "",
      `Channel: ${channel}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}