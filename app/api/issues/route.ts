import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {

  const { data: issues, error: issuesError } = await supabase
    .from("issues")
    .select("*")
    .order("created_at", { ascending: false })

  if (issuesError || !issues) {
    return NextResponse.json({ issues: [] })
  }

  const { data: properties } = await supabase
    .from("properties")
    .select("id, property_name")

  const propertyMap =
    properties?.reduce((acc: any, p: any) => {
      acc[p.id] = p.property_name
      return acc
    }, {}) ?? {}

  const result = issues.map((issue: any) => ({
    ...issue,
    property_name: propertyMap[issue.property_id] ?? "Unknown property"
  }))

  return NextResponse.json({
    issues: result
  })

}