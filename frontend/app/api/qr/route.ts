import { NextResponse } from "next/server"
import QRCode from "qrcode"

export async function GET(req: Request) {

  const { searchParams } = new URL(req.url)

  const property = searchParams.get("property")

  if (!property) {
    return NextResponse.json({ error: "missing property id" })
  }

  const url = `http://localhost:3000/stay/${property}`

  const qr = await QRCode.toDataURL(url)

  return NextResponse.json({
    qr,
    url
  })
}