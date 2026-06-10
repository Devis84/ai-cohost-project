 import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");

    if (!propertyId) {
      return Response.json(null);
    }

    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("property_info")
      .select("*")
      .eq("property_id", propertyId)
      .single();

    if (error) {
      console.error("PROPERTY INFO ERROR:", error);

      return Response.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return Response.json(data);
  } catch (error) {
    console.error("PROPERTY INFO SERVER ERROR:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load property info",
      },
      { status: 500 }
    );
  }
}