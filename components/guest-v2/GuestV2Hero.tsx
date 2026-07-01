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
    <section className="overflow-hidden rounded-[2.25rem] bg-white shadow-sm ring-1 ring-black/5">
      <div
        className="relative h-56 bg-gradient-to-br from-[#d8c5a7] via-[#efe2cf] to-[#9eb6b8] bg-cover bg-center"
        style={
          hasImage
            ? {
                backgroundImage: `url("${imageUrl}")`,
              }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.72),rgba(0,0,0,0.18),rgba(0,0,0,0.08))]" />

        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-black shadow-sm backdrop-blur">
          {dayLabel}
        </div>

        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-sm font-medium text-white/80">
            {propertyLocation}
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
            Hi, {guestName} 👋
          </h1>

          <p className="mt-2 text-base font-semibold text-white">
            {propertyName}
          </p>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-[#f6f1e8] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-black/40">
              Stay
            </p>
            <p className="mt-1 text-sm font-bold">{stayStatus}</p>
          </div>

          <div className="rounded-3xl bg-[#f6f1e8] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-black/40">
              Weather
            </p>
            <p className="mt-1 text-sm font-bold">{weatherLabel}</p>
          </div>
        </div>
      </div>
    </section>
  );
}