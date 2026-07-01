 import { GuestV2AccessState } from "@/components/guest-v2/GuestV2AccessState";
import { GuestV2Header } from "@/components/guest-v2/GuestV2Header";
import { GuestV2Hero } from "@/components/guest-v2/GuestV2Hero";
import { GuestV2SectionGrid } from "@/components/guest-v2/GuestV2SectionGrid";
import { GuestV2Shell } from "@/components/guest-v2/GuestV2Shell";
import { GuestV2SmartCard } from "@/components/guest-v2/GuestV2SmartCard";
import { GuestV2TodayCard } from "@/components/guest-v2/GuestV2TodayCard";
import { buildGuestV2StayFromToken } from "@/lib/guest-v2/stay-builder";

type GuestV2PageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function GuestV2Page({ params }: GuestV2PageProps) {
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

      <section className="px-4 pb-8 pt-4">
        <GuestV2Hero
          guestName={stay.guest.name}
          propertyName={stay.property.name}
          propertyLocation={stay.property.location}
          stayStatus={stay.stay.statusLabel}
          weatherLabel={stay.weather.label}
          dayLabel={stay.stay.dayLabel}
          imageUrl={stay.property.imageUrl}
        />

        <div className="mt-4">
          <GuestV2TodayCard
            title={stay.today.title}
            subtitle={stay.today.subtitle}
            progressLabel={stay.stay.progressLabel}
            progressPercent={stay.stay.progressPercent}
            items={stay.today.items}
          />
        </div>

        <div className="mt-4">
          <GuestV2SmartCard
            icon={stay.smartTip.icon}
            eyebrow={stay.smartTip.eyebrow}
            title={stay.smartTip.title}
            body={stay.smartTip.body}
          />
        </div>

        <div className="mt-5">
          <GuestV2SectionGrid
            token={stay.token}
            sections={stay.sections}
            checkoutTime={stay.stay.checkoutTime}
          />
        </div>
      </section>
    </GuestV2Shell>
  );
}