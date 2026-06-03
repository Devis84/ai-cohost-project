 import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase/supabase-server";

type PropertyRecord = {
  id: string;
  property_name?: string | null;
  name?: string | null;
  city?: string | null;
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

    const { data: propertiesData, error: propertiesError } =
      await supabaseServer
        .from("properties")
        .select("id, property_name, name, city");

    if (propertiesError) {
      console.error(
        "GET /api/issues properties warning:",
        propertiesError
      );
    }

    const propertyMap =
      new Map<string, PropertyRecord>();

    for (const property of propertiesData || []) {
      propertyMap.set(property.id, property);
    }

    const issues =
      ((issuesData || []) as IssueRecord[]).map((issue) => {
        const property = issue.property_id
          ? propertyMap.get(issue.property_id)
          : null;

        return {
          ...issue,
          property_name:
            property?.property_name ||
            property?.name ||
            "Unknown property",
          property_city:
            property?.city || "",
          priority:
            issue.priority ||
            issue.severity ||
            "normal",
          status:
            issue.status ||
            "open",
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