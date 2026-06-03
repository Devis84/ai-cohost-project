 import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase/supabase-server";

async function tryResolveIssue(issueId: string) {
  const attempts = [
    {
      status: "resolved",
    },
    {
      status: "closed",
    },
  ];

  for (const payload of attempts) {
    const { data, error } = await supabaseServer
      .from("issues")
      .update(payload)
      .eq("id", issueId)
      .select("*")
      .maybeSingle();

    if (!error) {
      return {
        data,
        error: null,
      };
    }

    console.error(
      "RESOLVE ISSUE ATTEMPT FAILED:",
      error
    );
  }

  return {
    data: null,
    error: "Unable to resolve issue",
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const issueId =
      body.issueId ||
      body.issue_id ||
      body.id;

    if (!issueId) {
      return NextResponse.json(
        {
          success: false,
          error: "issueId is required",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } =
      await tryResolveIssue(issueId);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      issue: data,
    });
  } catch (error) {
    console.error(
      "POST /api/issues/resolve ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to resolve issue",
      },
      {
        status: 500,
      }
    );
  }
}