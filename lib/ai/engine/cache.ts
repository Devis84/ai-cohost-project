import { supabaseServer } from "@/lib/supabase/supabase-server";

export type CachedAnswer = {
  id: string;
  answer: string;
  question_normalized: string;
  usage_count: number;
};

function safeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function normalizeQuestionForCache(message: string) {
  return message
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

export function getCachePropertySlug({
  property,
  propertySlug,
}: {
  property: {
    id: string;
    slug?: string | null;
  };
  propertySlug?: string;
}) {
  return (
    safeString(property.slug).trim() ||
    safeString(propertySlug).trim() ||
    property.id
  );
}

export async function findCachedAnswer({
  propertySlug,
  question,
}: {
  propertySlug: string;
  question: string;
}) {
  const questionNormalized = normalizeQuestionForCache(question);

  if (!propertySlug || questionNormalized.length < 3) {
    return null;
  }

  const { data, error } = await supabaseServer
    .from("ai_answer_cache")
    .select("id, answer, question_normalized, usage_count")
    .eq("property_slug", propertySlug)
    .eq("question_normalized", questionNormalized)
    .eq("approved", true)
    .maybeSingle();

  if (error) {
    console.error("AI CACHE LOOKUP FAILED:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  const cachedAnswer = data as CachedAnswer;

  const { error: updateError } = await supabaseServer
    .from("ai_answer_cache")
    .update({
      usage_count: (cachedAnswer.usage_count || 0) + 1,
      last_used_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", cachedAnswer.id);

  if (updateError) {
    console.error("AI CACHE USAGE UPDATE FAILED:", updateError);
  }

  return cachedAnswer;
}

export async function saveAnswerToCache({
  propertySlug,
  question,
  answer,
  channel,
  source,
  metadata,
}: {
  propertySlug: string;
  question: string;
  answer: string;
  channel: string;
  source: string;
  metadata?: Record<string, unknown>;
}) {
  const questionNormalized = normalizeQuestionForCache(question);

  if (!propertySlug || questionNormalized.length < 3 || !answer.trim()) {
    return;
  }

  const now = new Date().toISOString();

  const { data: existing, error: existingError } = await supabaseServer
    .from("ai_answer_cache")
    .select("id, usage_count")
    .eq("property_slug", propertySlug)
    .eq("question_normalized", questionNormalized)
    .maybeSingle();

  if (existingError) {
    console.error("AI CACHE EXISTING LOOKUP FAILED:", existingError);
    return;
  }

  if (existing?.id) {
    const { error: updateError } = await supabaseServer
      .from("ai_answer_cache")
      .update({
        answer,
        source,
        channel,
        usage_count: Number(existing.usage_count || 0) + 1,
        last_used_at: now,
        approved: true,
        metadata: {
          ...(metadata || {}),
          updated_from: "chat_api",
        },
        updated_at: now,
      })
      .eq("id", existing.id);

    if (updateError) {
      console.error("AI CACHE UPDATE FAILED:", updateError);
    }

    return;
  }

  const { error: insertError } = await supabaseServer
    .from("ai_answer_cache")
    .insert({
      property_slug: propertySlug,
      question_normalized: questionNormalized,
      question_original: question,
      answer,
      source,
      channel,
      usage_count: 1,
      last_used_at: now,
      approved: true,
      metadata: {
        ...(metadata || {}),
        created_from: "chat_api",
      },
    });

  if (insertError) {
    console.error("AI CACHE INSERT FAILED:", insertError);
  }
}