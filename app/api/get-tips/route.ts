
export const runtime = "nodejs";

 import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("property_id");

    if (!propertyId) {
      return NextResponse.json({
        success: true,
        tips: [],
      });
    }

    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("local_tips")
      .select("*")
      .eq("property_id", propertyId);

    if (error) {
      console.error("GET TIPS ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          tips: [],
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tips: data || [],
    });
  } catch (error) {
    console.error("GET TIPS SERVER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        tips: [],
        error:
          error instanceof Error
            ? error.message
            : "Unable to load tips",
      },
      { status: 500 }
    );
  }
}
