import { NextResponse } from "next/server";

export function chatError({
  error,
  status,
}: {
  error: string;
  status: number;
}) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

export function chatSuccess({
  reply,
  conversationId,
  escalation,
  blocked,
  blockedReason,
  usedFallback,
  cache,
}: {
  reply: string;
  conversationId: string;
  escalation: unknown;
  blocked: boolean;
  blockedReason?: string;
  usedFallback: boolean;
  cache: Record<string, unknown>;
}) {
  return NextResponse.json({
    success: true,
    reply,
    conversationId,
    escalation,
    blocked,
    blockedReason,
    usedFallback,
    cache,
  });
}