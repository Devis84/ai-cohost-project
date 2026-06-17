 import { redirect } from "next/navigation";

type StayRedirectPageProps = {
  params: {
    property: string;
  };
};

export default function StayRedirectPage({
  params,
}: StayRedirectPageProps) {
  const propertySlug = params.property;

  redirect(`/guest/${propertySlug}`);
}