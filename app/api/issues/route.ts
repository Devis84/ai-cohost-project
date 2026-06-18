
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

 import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase/supabase-server";

type PropertyRecord = {
  id: string;
  property_name?: string | null;
  name?: string | null;
  city?: string | null;
  slug?: string | null;
};

type ConversationRecord = {
  id?: string;
  conversation_id?: string | null;
  property_id?: string | null;
};

type IssueRecord = {
  id: string;
  property_id?: string | null;
  conversation_id?: string | null;
  guest_name?: string | null;
  issue_type?: string | null;
  priority?: string | null;
  severity?: string | null;
  status?: string | null;
  message?: string | null;
  description?: string | null;
  created_at?: string | null;
};

function getPropertyName(property?: PropertyRecord | null) {
  if (!property) {
    return "";
  }

  return (
    property.property_name ||
    property.name ||
    property.slug ||
    "Unknown property"
  );
}

function getIssuePriority(issue: IssueRecord) {
  return (
    issue.priority ||
    issue.severity ||
    "normal"
  );
}

async function loadProperties() {
  const { data, error } = await supabaseServer
    .from("properties")
    .select("*");

  if (error) {
    console.error("LOAD PROPERTIES FOR ISSUES ERROR:", error);
    return [];
  }

  return (data || []) as PropertyRecord[];
}

async function loadConversations() {
  const { data, error } = await supabaseServer
    .from("conversations")
    .select("*");

  if (error) {
    console.error("LOAD CONVERSATIONS FOR ISSUES ERROR:", error);
    return [];
  }

  return (data || []) as ConversationRecord[];
}

export async function GET() {
  try {
    const { data: issuesData, error: issuesError } =
      await supabaseServer
        .from("issues")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (issuesError) {
      throw issuesError;
    }

    const properties = await loadProperties();
    const conversations = await loadConversations();

    const propertyMap = new Map<string, PropertyRecord>();

    for (const property of properties) {
      if (property.id) {
        propertyMap.set(property.id, property);
      }
    }

    const conversationMap =
      new Map<string, ConversationRecord>();

    for (const conversation of conversations) {
      if (conversation.conversation_id) {
        conversationMap.set(
          conversation.conversation_id,
          conversation
        );
      }

      if (conversation.id) {
        conversationMap.set(
          conversation.id,
          conversation
        );
      }
    }

    const issues =
      ((issuesData || []) as IssueRecord[]).map((issue) => {
        const conversation =
          issue.conversation_id
            ? conversationMap.get(issue.conversation_id)
            : null;

        const resolvedPropertyId =
          issue.property_id ||
          conversation?.property_id ||
          null;

        const property =
          resolvedPropertyId
            ? propertyMap.get(resolvedPropertyId)
            : null;

        const propertyName =
          getPropertyName(property) ||
          (resolvedPropertyId
            ? `Property ${resolvedPropertyId.slice(0, 8)}`
            : "Unknown property");

        return {
          ...issue,

          property_id: resolvedPropertyId,

          property_name: propertyName,

          property_city:
            property?.city || "",

          priority:
            getIssuePriority(issue),

          status:
            issue.status || "open",

          description:
            issue.description ||
            issue.message ||
            "No description provided.",
        };
      });

    return NextResponse.json({
      success: true,
      issues,
    });
  } catch (error) {
    console.error("GET /api/issues ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        issues: [],
        error:
          error instanceof Error
            ? error.message
            : "Unable to load issues",
      },
      {
        status: 500,
      }
    );
  }
}
