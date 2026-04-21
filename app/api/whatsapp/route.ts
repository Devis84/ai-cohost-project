import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const verify_token = "ai-cohost-token";

  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === verify_token) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Error", { status: 403 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const message =
      body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const from = message.from;
    const text = message.text?.body;

    console.log("📩 WhatsApp message:", text);

    // 🔁 manda al tuo AI
    const aiRes = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: text }),
    });

    const aiData = await aiRes.json();

    const reply = aiData.reply;

    // 📤 invia risposta su WhatsApp
    await fetch(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: from,
          text: { body: reply },
        }),
      }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "error" });
  }
}