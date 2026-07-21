import { supabaseServer } from "@/lib/supabase/supabase-server";

export type GuestEscalation = {
  priority: string;
  requires_host: boolean;
  issue_detected: string | null;
  issue_type: string | null;
};

async function tryInsertNotification(payloads: Record<string, unknown>[]) {
  for (const payload of payloads) {
    const { data, error } = await supabaseServer
      .from("notifications")
      .insert(payload)
      .select("*")
      .maybeSingle();

    if (!error) {
      return data;
    }

    console.error("CREATE NOTIFICATION ATTEMPT FAILED:", error);
  }

  return null;
}

async function tryInsertIssue(payloads: Record<string, unknown>[]) {
  for (const payload of payloads) {
    const { data, error } = await supabaseServer
      .from("issues")
      .insert(payload)
      .select("*")
      .maybeSingle();

    if (!error) {
      return data;
    }

    console.error("CREATE ISSUE ATTEMPT FAILED:", error);
  }

  return null;
}

export async function createHostAlert({
  propertyId,
  conversationId,
  message,
  priority,
  issueType,
}: {
  propertyId: string;
  conversationId: string;
  message: string;
  priority: string;
  issueType: string | null;
}) {
  const title =
    priority === "high" ? "Urgent guest issue detected" : "Guest issue detected";

  const now = new Date().toISOString();

  await tryInsertNotification([
    {
      property_id: propertyId,
      conversation_id: conversationId,
      type: "guest_issue",
      title,
      message,
      priority,
      read: false,
      created_at: now,
    },
    {
      property_id: propertyId,
      conversation_id: conversationId,
      title,
      message,
      priority,
      created_at: now,
    },
    {
      property_id: propertyId,
      title,
      message,
      created_at: now,
    },
  ]);

  const issue = await tryInsertIssue([
    {
      property_id: propertyId,
      conversation_id: conversationId,
      issue_type: issueType || "guest_issue",
      priority,
      severity: priority,
      status: "open",
      description: message,
      message,
      created_at: now,
    },
    {
      property_id: propertyId,
      conversation_id: conversationId,
      issue_type: issueType || "guest_issue",
      priority,
      status: "open",
      description: message,
      created_at: now,
    },
    {
      property_id: propertyId,
      conversation_id: conversationId,
      severity: priority,
      status: "open",
      message,
      created_at: now,
    },
    {
      property_id: propertyId,
      status: "open",
      description: message,
      created_at: now,
    },
    {
      property_id: propertyId,
      message,
      created_at: now,
    },
  ]);

  if (!issue) {
    console.error("CREATE ISSUE FAILED COMPLETELY");
  }

  return issue;
}