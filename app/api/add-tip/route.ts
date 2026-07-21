
export const runtime = "nodejs";

 import { createClient } from "@supabase/supabase-js";
import {
  getPartnerAccessContext,
  inactiveAccessResponse,
} from "@/lib/partner-access";

export const dynamic = "force-dynamic";

type AddTipPayload = {
  property_id?: string;
  type?: string;
  title?: string;
  description?: string;
};

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(req: Request) {
  try {
    const accessContext = await getPartnerAccessContext(req);

    if (!accessContext.isActive) {
      return inactiveAccessResponse(accessContext);
    }

    const body = (await req.json()) as AddTipPayload;

    const propertyId = body.property_id?.trim();
    const type = body.type?.trim();
    const title = body.title?.trim();
    const description = body.description?.trim();

    if (!propertyId || !type || !title) {
      return Response.json(
        {
          success: false,
          error: "property_id, type and title are required",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from("local_tips")
      .insert([
        {
          property_id: propertyId,
          type,
          title,
          description: description || "",
        },
      ]);

    if (error) {
      throw error;
    }

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error("ADD TIP ERROR:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to add tip",
      },
      { status: 500 }
    );
  }
}
