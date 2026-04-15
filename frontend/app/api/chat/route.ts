import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 📥 PROPERTY
    const { data: property } = await supabase
      .from("property_info")
      .select("*")
      .limit(1)
      .single();

    // 📥 MEMORY
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    const history =
      messages?.reverse().map((m) => ({
        role: m.role,
        content: m.content,
      })) || [];

    // 💾 save user message
    await supabase.from("messages").insert({
      role: "user",
      content: message,
    });

    // 🤖 AI
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `
You are an Airbnb host assistant.

STRICT RULES:
- Use ONLY the provided data
- DO NOT assume or invent anything
- If something is not explicitly written, say you don’t know
- Keep answers short, natural, and helpful
- Use conversation context

PROPERTY DATA:
WiFi: ${property.wifi}
Check-in: ${property.checkin}
Check-out: ${property.checkout}
Parking: ${property.parking}
Transport: ${property.transport}
Restaurants: ${property.restaurants}
Rules: ${property.house_rules}
Emergency: ${property.emergency_contact}
Description: ${property.description}
Location: ${property.location_info}
Extra: ${property.extra_notes}
            `,
          },
          ...history,
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    const aiData = await aiRes.json();

    const reply =
      aiData.choices?.[0]?.message?.content ||
      "Sorry, something went wrong.";

    // 💾 save AI reply
    await supabase.from("messages").insert({
      role: "assistant",
      content: reply,
    });

    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json({
      reply: "Server error.",
    });
  }
}