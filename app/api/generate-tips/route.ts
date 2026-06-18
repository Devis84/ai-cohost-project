 import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type GenerateTipsPayload = {
  property_id?: string;
  propertyId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateTipsPayload;

    const propertyId =
      body.property_id ||
      body.propertyId;

    if (!propertyId) {
      return NextResponse.json(
        {
          success: false,
          tips: [],
          error: "property_id is required",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      tips: [],
      message:
        "Automatic tip generation is currently disabled. Local Guide content is managed manually from the dashboard.",
    });
  } catch (error) {
    console.error("GENERATE TIPS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        tips: [],
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate tips",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    tips: [],
    message:
      "Automatic tip generation is currently disabled. Local Guide content is managed manually from the dashboard.",
  });
}