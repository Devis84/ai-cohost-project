 import { NextResponse } from "next/server";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getBaseUrl(req: Request) {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  const vercelUrl =
    process.env.VERCEL_URL?.trim();

  if (vercelUrl) {
    return `https://${vercelUrl}`.replace(/\/$/, "");
  }

  const requestUrl = new URL(req.url);

  return requestUrl.origin.replace(/\/$/, "");
}

function normalizePropertySlug(value: string) {
  return value
    .trim()
    .replace(/^\/+|\/+$/g, "");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const property = searchParams.get("property");

    if (!property || !property.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing property slug",
        },
        { status: 400 }
      );
    }

    const propertySlug = normalizePropertySlug(property);

    const baseUrl = getBaseUrl(req);

    const url = `${baseUrl}/guest/${encodeURIComponent(
      propertySlug
    )}`;

    const qr = await QRCode.toDataURL(url);

    return NextResponse.json({
      success: true,
      qr,
      url,
      legacy_redirect_supported: true,
      official_guest_path: `/guest/${propertySlug}`,
    });
  } catch (error) {
    console.error("GET /api/qr error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to generate QR code",
      },
      { status: 500 }
    );
  }
}