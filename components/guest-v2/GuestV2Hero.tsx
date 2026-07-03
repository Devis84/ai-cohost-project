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
    <section className="overflow-hidden rounded-[2.5rem] bg-white shadow-lg ring-1 ring-black/5">
      <div
        className="relative h-[24rem] bg-gradient-to-br from-[#d8c5a7] via-[#efe2cf] to-[#6f817f] bg-cover bg-center"
        style={
          hasImage
            ? {
                backgroundImage: `url("${imageUrl}")`,
              }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.85),rgba(0,0,0,0.35),rgba(0,0,0,0.1))]" />

        <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-2">
          <div className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-black shadow-md backdrop-blur">
            ✓ Verified Stay
          </div>

          <div className="rounded-full bg-black/50 px-3 py-1.5 text-xs font-bold text-white shadow-md backdrop-blur">
            {weatherLabel}
          </div>
        </div>

        <div className="absolute bottom-6 left-5 right-5">
          <div className="mb-2 inline-flex rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
            {dayLabel}
          </div>

          <p className="text-sm font-semibold text-white/80">
            {propertyLocation}
          </p>

          <h1 className="mt-2 text-5xl font-black leading-none tracking-tight text-white drop-shadow-lg">
            Hi, {guestName}
          </h1>

          <p className="mt-3 text-lg font-bold text-white/98 drop-shadow">
            {propertyName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        <div className="rounded-[1.75rem] bg-gradient-to-br from-[#f6f1e8] to-[#ede8e0] p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wide text-black/40">
            Stay Status
          </p>
          <p className="mt-2 text-sm font-black leading-tight text-black">
            {stayStatus}
          </p>
        </div>

        <div className="rounded-[1.75rem] bg-black p-4 text-white shadow-md">
          <p className="text-[11px] font-black uppercase tracking-wide text-white/50">
            AI Support
          </p>
          <p className="mt-2 text-sm font-black leading-tight text-white">
            24/7 Ready
          </p>
        </div>
      </div>
    </section>
  );
}