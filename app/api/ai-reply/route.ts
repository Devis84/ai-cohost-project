
export const runtime = "nodejs";

 import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type AiReplyPayload = {
  propertyId?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AiReplyPayload;

    const propertyId = body.propertyId?.trim();

    console.log("FORCED CLEANING TASK CREATION");

    if (!propertyId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing propertyId",
        },
        { status: 400 }
      );
    }

    const { createCleaningTask } = await import(
      "@/lib/services/cleaning-service"
    );

    const checkoutDate = new Date().toISOString().split("T")[0];

    await createCleaningTask({
      propertyId,
      checkoutDate,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("AI REPLY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Server error",
      },
      { status: 500 }
    );
  }
}
