
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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const conversationId =
      body.conversation_id ||
      body.conversationId;

    if (!conversationId) {
      return NextResponse.json(
        {
          success: false,
          error: "conversation_id is required",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("conversations")
      .update({
        unread_count: 0,
      })
      .eq("conversation_id", conversationId)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error(
        "PATCH /api/conversations/read ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      conversation: data,
    });
  } catch (error) {
    console.error(
      "PATCH /api/conversations/read FAILED:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to mark conversation as read",
      },
      {
        status: 500,
      }
    );
  }
}
