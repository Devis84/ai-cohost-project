 type GuestV2HeroProps = {
  guestName: string;
  propertyName: string;
  propertyLocation: string;
  stayStatus: string;
  weatherLabel: string;
  dayLabel: string;
  imageUrl: string;
};

export function GuestV2Hero({
  guestName,
  propertyName,
  propertyLocation,
  stayStatus,
  weatherLabel,
  dayLabel,
  imageUrl,
}: GuestV2HeroProps) {
  const hasImage = imageUrl.trim().length > 0;

  return (
    <section className="overflow-hidden rounded-[2.5rem] bg-white shadow-sm ring-1 ring-black/5">
      <div
        className="relative h-[22rem] bg-gradient-to-br from-[#d8c5a7] via-[#efe2cf] to-[#6f817f] bg-cover bg-center"
        style={
          hasImage
            ? {
                backgroundImage: `url("${imageUrl}")`,
              }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.82),rgba(0,0,0,0.32),rgba(0,0,0,0.08))]" />

        <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-2">
          <div className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-black shadow-sm backdrop-blur">
            Verified Stay
          </div>

          <div className="rounded-full bg-black/45 px-3 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur">
            {weatherLabel}
          </div>
        </div>

        <div className="absolute bottom-5 left-5 right-5">
          <div className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
            {dayLabel}
          </div>

          <p className="text-sm font-semibold text-white/75">
            {propertyLocation}
          </p>

          <h1 className="mt-1 text-4xl font-black leading-none tracking-tight text-white">
            Hi, {guestName} 👋
          </h1>

          <p className="mt-3 text-lg font-bold text-white/95">
            {propertyName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        <div className="rounded-3xl bg-[#f6f1e8] p-4">
          <p className="text-[11px] font-black uppercase tracking-wide text-black/35">
            Stay
          </p>
          <p className="mt-1 text-sm font-black">{stayStatus}</p>
        </div>

        <div className="rounded-3xl bg-black p-4 text-white">
          <p className="text-[11px] font-black uppercase tracking-wide text-white/40">
            Concierge
          </p>
          <p className="mt-1 text-sm font-black">Always available</p>
        </div>
      </div>
    </section>
  );
}