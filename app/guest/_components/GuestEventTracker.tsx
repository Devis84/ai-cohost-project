 "use client";

import { useEffect, useRef } from "react";

type GuestEventType =
  | "guest_page_opened"
  | "wifi_info_viewed"
  | "checkin_info_viewed"
  | "ai_chat_started"
  | "issue_reported";

type GuestEventTrackerProps = {
  propertySlug: string;
  eventType: GuestEventType;
  eventSource?: string;
  eventLabel?: string;
  eventMetadata?: Record<string, unknown>;
};

function createGuestSessionToken(propertySlug: string) {
  const storageKey = `ai_cohost_guest_session_${propertySlug}`;

  try {
    const existingToken =
      window.sessionStorage.getItem(storageKey);

    if (existingToken) {
      return existingToken;
    }

    const newToken =
      typeof crypto !== "undefined" &&
      "randomUUID" in crypto
        ? crypto.randomUUID()
        : `guest_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}`;

    window.sessionStorage.setItem(storageKey, newToken);

    return newToken;
  } catch {
    return `guest_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;
  }
}

export function GuestEventTracker({
  propertySlug,
  eventType,
  eventSource = "guest_page",
  eventLabel,
  eventMetadata = {},
}: GuestEventTrackerProps) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!propertySlug || trackedRef.current) {
      return;
    }

    trackedRef.current = true;

    const guestToken = createGuestSessionToken(propertySlug);

    fetch("/api/guest-events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        property_slug: propertySlug,
        event_type: eventType,
        event_source: eventSource,
        event_label: eventLabel,
        event_metadata: eventMetadata,
        guest_token: guestToken,
        guest_language:
          typeof navigator !== "undefined"
            ? navigator.language
            : null,
      }),
    }).catch((error) => {
      console.error("GUEST EVENT TRACKING ERROR:", error);
    });
  }, [
    propertySlug,
    eventType,
    eventSource,
    eventLabel,
    eventMetadata,
  ]);

  return null;
}