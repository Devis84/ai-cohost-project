import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/supabase-server"


export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const propertyId =
      body.property_id ||
      body.propertyId ||
      body.id

    if (!propertyId) {
      return NextResponse.json(
        {
          success: false,
          error: "property_id is required",
        },
        { status: 400 }
      )
    }

    const propertyInfoPayload = {
      property_id: propertyId,
      wifi: body.wifi || "",
      checkin: body.checkin || "",
      checkout: body.checkout || "",
      parking: body.parking || "",
      restaurants: body.restaurants || "",
      transport: body.transport || "",
      house_rules: body.house_rules || "",
      updated_at: new Date().toISOString(),
    }

    const { data: existingInfo } = await supabaseServer
      .from("property_info")
      .select("id")
      .eq("property_id", propertyId)
      .maybeSingle()

    let propertyInfoError = null

    if (existingInfo?.id) {
      const response = await supabaseServer
        .from("property_info")
        .update(propertyInfoPayload)
        .eq("id", existingInfo.id)

      propertyInfoError = response.error
    } else {
      const response = await supabaseServer
        .from("property_info")
        .insert(propertyInfoPayload)

      propertyInfoError = response.error
    }

    if (propertyInfoError) {
      throw propertyInfoError
    }

    const propertyPayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.checkin) {
      propertyPayload.checkin_time = body.checkin
    }

    if (body.checkout) {
      propertyPayload.checkout_time = body.checkout
    }

    if (body.house_rules) {
      propertyPayload.house_rules = body.house_rules
    }

    if (body.wifi) {
      propertyPayload.knowledge_base = {
        legacy_property_info: {
          wifi: body.wifi,
          parking: body.parking || "",
          restaurants: body.restaurants || "",
          transport: body.transport || "",
          house_rules: body.house_rules || "",
        },
      }
    }

    if (Object.keys(propertyPayload).length > 1) {
      await supabaseServer
        .from("properties")
        .update(propertyPayload)
        .eq("id", propertyId)
    }

    return NextResponse.json({
      success: true,
      message: "Property saved successfully",
    })
  } catch (error) {
    console.error("POST /api/save-property error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Unable to save property",
      },
      { status: 500 }
    )
  }
}
