 import Link from "next/link";
import { notFound } from "next/navigation";

import { GuestV2AccessState } from "@/components/guest-v2/GuestV2AccessState";
import { GuestV2Header } from "@/components/guest-v2/GuestV2Header";
import { GuestV2InfoCard } from "@/components/guest-v2/GuestV2InfoCard";
import { GuestV2SectionHero } from "@/components/guest-v2/GuestV2SectionHero";
import { GuestV2Shell } from "@/components/guest-v2/GuestV2Shell";
import { GuestV2SmartCard } from "@/components/guest-v2/GuestV2SmartCard";
import { findGuestV2Section } from "@/lib/guest-v2/stay";
import { buildGuestV2StayFromToken } from "@/lib/guest-v2/stay-builder";

type SectionPageProps = {
  params: Promise<{
    token: string;
    slug: string;
  }>;
};

export default async function GuestV2SectionPage({ params }: SectionPageProps) {
  const { token, slug } = await params;
  const stay = await buildGuestV2StayFromToken(token);

  if (!stay.access.allowed) {
    return (
      <GuestV2AccessState
        title={stay.access.title}
        message={stay.access.message}
        stateLabel={stay.access.state}
        whatsappUrl={stay.host.whatsappUrl}
      />
    );
  }

  const section = findGuestV2Section(stay, slug);

  if (!section) {
    notFound();
  }

  return (
    <GuestV2Shell>
      <GuestV2Header
        token={stay.token}
        hostWhatsappUrl={stay.host.whatsappUrl}
      />

      <section className="px-4 pb-8 pt-4">
        <Link
          href={`/guest-v2/${stay.token}`}
          className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-black shadow-sm ring-1 ring-black/5 active:scale-[0.98]"
        >
          ← Back to stay
        </Link>

        <div className="mt-4">
          <GuestV2SectionHero
            title={section.title}
            icon={section.icon}
            eyebrow={section.eyebrow}
            intro={section.intro}
            propertyLocation={stay.property.location}
          />
        </div>

        <div className="mt-4">
          <GuestV2SmartCard
            icon="💬"
            eyebrow="Need help?"
            title={section.primaryAction}
            body="The AI Concierge can answer instantly using the information prepared by the host for this stay."
          />
        </div>

        <section className="mt-4 space-y-3">
          {section.items.map((item) => (
            <GuestV2InfoCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              body={item.body}
            />
          ))}
        </section>
      </section>
    </GuestV2Shell>
  );
}