import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 🔥 DEBUG ENV
    console.log("SERVICE KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { message } = await req.json();

    // 🔥 SALVA USER MESSAGE
    const { data: userData, error: userError } = await supabase
      .from("messages")
      .insert({
        role: "user",
        content: message,
      })
      .select();

    console.log("USER INSERT:", userData, userError);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an Airbnb co-host assistant. Answer clearly and helpfully.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const reply = completion.choices[0].message.content;

    // 🔥 SALVA AI RESPONSE
    const { data: aiData, error: aiError } = await supabase
      .from("messages")
      .insert({
        role: "assistant",
        content: reply,
      })
      .select();

    console.log("AI INSERT:", aiData, aiError);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("API ERROR:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}