 import { NextResponse } from "next/server"

import { supabaseServer } from "@/lib/supabase/supabase-server"

export async function GET() {
  try {
    const { data: issues, error: issuesError } =
      await supabaseServer
        .from("issues")
        .select("*")
        .order("created_at", {
          ascending: false,
        })

    if (issuesError) {
      throw issuesError
    }

    const { data: properties } =
      await supabaseServer
        .from("properties")
        .select("id, property_name, name")

    const propertyMap =
      new Map<string, string>()

    for (const property of properties || []) {
      propertyMap.set(
        property.id,
        property.property_name ||
          property.name ||
          "Unknown property"
      )
    }

    const result =
      (issues || []).map((issue) => ({
        ...issue,
        property_name:
          propertyMap.get(issue.property_id) ||
          "Unknown property",
      }))

    return NextResponse.json({
      success: true,
      issues: result,
    })
  } catch (error) {
    console.error("GET /api/issues ERROR:", error)

    return NextResponse.json(
      {
        success: false,
        issues: [],
        error: "Unable to load issues",
      },
      { status: 500 }
    )
  }
}