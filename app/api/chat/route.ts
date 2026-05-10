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

    const {
      message,
      propertySlug,
      conversationId,
    } = await req.json();

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

    // LOAD MEMORY

    const { data: previousMessages } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    const history =
      previousMessages?.map((m) => ({
        role: m.role,
        content: m.content,
      })) || [];

    // BUILD PROMPT

    const systemPrompt =
      buildKnowledgePrompt(property);

    // SAVE USER MESSAGE

    await supabase
      .from("messages")
      .insert({
        property_id: property.id,
        conversation_id: conversationId,
        role: "user",
        content: message,
      });

    // OPENAI

    const completion =
      await openai.chat.completions.create({

        model: "gpt-4o-mini",

        temperature: 0.2,

        messages: [

          {
            role: "system",
            content: systemPrompt,
          },

          ...history,

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
        property_id: property.id,
        conversation_id: conversationId,
        role: "assistant",
        content: reply,
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