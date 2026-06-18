 import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function WelcomeRedirect({
  params,
}: {
  params: Promise<{ property: string }>;
}) {
  const resolvedParams = await params;

  const propertySlug = decodeURIComponent(
    resolvedParams.property
  );

  redirect(`/guest/${propertySlug}`);
}