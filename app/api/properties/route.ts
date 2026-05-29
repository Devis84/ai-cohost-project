import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/supabase-server"

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      properties: data || [],
    })
  } catch (error) {
    console.error("GET /api/properties error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load properties",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const propertyName =
      body.property_name ||
      body.name ||
      body.title ||
      ""

    if (!propertyName.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "property_name is required",
        },
        { status: 400 }
      )
    }

    const slug =
      body.slug ||
      createSlug(propertyName)

    const payload = {
      ...body,
      property_name: propertyName,
      slug,
      updated_at: new Date().toISOString(),
    }

    const { data: existing } = await supabaseServer
      .from("properties")
      .select("id")
      .or(`slug.eq.${slug},property_name.eq.${propertyName}`)
      .maybeSingle()

    if (existing?.id) {
      const { data, error } = await supabaseServer
        .from("properties")
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .single()

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        property: data,
        mode: "updated",
      })
    }

    const { data, error } = await supabaseServer
      .from("properties")
      .insert(payload)
      .select("*")
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      property: data,
      mode: "created",
    })
  } catch (error) {
    console.error("POST /api/properties error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Unable to save property",
      },
      { status: 500 }
    )
  }
}