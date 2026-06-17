 import { redirect } from "next/navigation";

type StayRedirectPageProps = {
  params: Promise<{
    property: string;
  }>;
};

export default async function StayRedirectPage({
  params,
}: StayRedirectPageProps) {
  const { property } = await params;

  if (!property) {
    redirect("/dashboard");
  }

  redirect(`/guest/${encodeURIComponent(property)}`);
}