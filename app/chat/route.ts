 import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { buildKnowledgePrompt } from "@/lib/buildKnowledgePrompt";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {

  try {

    const { message, propertySlug } = await req.json();

    // LOAD PROPERTY

    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("*")
      .eq("slug", propertySlug)
      .single();

    if (propertyError || !property) {

      console.error(propertyError);

      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // BUILD AI SYSTEM PROMPT

    const systemPrompt = buildKnowledgePrompt(property);

    // SAVE USER MESSAGE

    await supabase
      .from("messages")
      .insert({
        role: "user",
        content: message,
        property_id: property.id,
      });

    // OPENAI

    const completion = await openai.chat.completions.create({

      model: "gpt-4o-mini",

      messages: [

        {
          role: "system",
          content: systemPrompt,
        },

        {
          role: "user",
          content: message,
        },
      ],
    });

    const reply =
      completion.choices[0].message.content || "";

    // SAVE AI MESSAGE

    await supabase
      .from("messages")
      .insert({
        role: "assistant",
        content: reply,
        property_id: property.id,
      });

    return NextResponse.json({
      reply,
    });

  } catch (error) {

    console.error("CHAT API ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}