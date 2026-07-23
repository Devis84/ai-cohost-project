export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/supabase-server";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

async function findProperty(identifier: string) {
  const cleanIdentifier = decodeURIComponent(identifier).trim();

  if (!cleanIdentifier) {
    return null;
  }

  const { data: bySlug } = await supabaseServer
    .from("properties")
    .select("*")
    .eq("slug", cleanIdentifier)
    .maybeSingle();

  if (bySlug) {
    return bySlug;
  }

  const { data: byId } = await supabaseServer
    .from("properties")
    .select("*")
    .eq("id", cleanIdentifier)
    .maybeSingle();

  if (byId) {
    return byId;
  }

  const { data: byName } = await supabaseServer
    .from("properties")
    .select("*")
    .eq("property_name", cleanIdentifier)
    .maybeSingle();

  if (byName) {
    return byName;
  }

  return null;
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;

    const property = await findProperty(slug);

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          error: "Property not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      property,
    });
  } catch (error) {
    console.error(
      "GET /api/guest-property/[slug] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load property",
      },
      {
        status: 500,
      }
    );
  }
}