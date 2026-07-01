import Link from "next/link";

import { GuestV2AccessState } from "@/components/guest-v2/GuestV2AccessState";
import { GuestV2Chat } from "@/components/guest-v2/GuestV2Chat";
import { GuestV2Header } from "@/components/guest-v2/GuestV2Header";
import { GuestV2Shell } from "@/components/guest-v2/GuestV2Shell";
import { buildGuestV2StayFromToken } from "@/lib/guest-v2/stay-builder";

type GuestV2AiPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function GuestV2AiPage({ params }: GuestV2AiPageProps) {
  const { token } = await params;
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

  return (
    <GuestV2Shell>
      <GuestV2Header
        token={stay.token}
        hostWhatsappUrl={stay.host.whatsappUrl}
      />

      <section className="px-4 pb-4 pt-4">
        <Link
          href={`/guest-v2/${stay.token}`}
          className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-black shadow-sm ring-1 ring-black/5 active:scale-[0.98]"
        >
          ← Back to stay
        </Link>

        <div className="mt-4 rounded-[2rem] bg-black p-5 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/45">
            AI Concierge
          </p>

          <h1 className="mt-2 text-2xl font-bold">
            Ask anything about your stay
          </h1>

          <p className="mt-2 text-sm leading-6 text-white/70">
            Wi-Fi, checkout, house rules, restaurants, transport, local tips and
            guest support.
          </p>
        </div>

        <div className="mt-4">
          <GuestV2Chat
            token={stay.token}
            propertyName={stay.property.name}
            guestName={stay.guest.name}
          />
        </div>
      </section>
    </GuestV2Shell>
  );
}