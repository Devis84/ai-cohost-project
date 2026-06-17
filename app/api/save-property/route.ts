 import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Deprecated endpoint.
 *
 * This route belonged to the old property_info / stay-page flow.
 * It must not write to the properties table anymore because it can overwrite
 * the modern knowledge_base structure used by:
 *
 * - /dashboard
 * - /guest/[slug]
 * - /api/properties
 * - /api/properties/[slug]
 *
 * Use /api/properties instead.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      deprecated: true,
      error:
        "This endpoint is deprecated. Use /api/properties instead.",
      replacement_endpoint: "/api/properties",
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      deprecated: true,
      error:
        "This endpoint is deprecated. Use /api/properties instead.",
      replacement_endpoint: "/api/properties",
    },
    { status: 410 }
  );
}