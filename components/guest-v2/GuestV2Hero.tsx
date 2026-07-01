type GuestV2HeroProps = {
  guestName: string;
  propertyName: string;
  propertyLocation: string;
  stayStatus: string;
  weatherLabel: string;
};

export function GuestV2Hero({
  guestName,
  propertyName,
  propertyLocation,
  stayStatus,
  weatherLabel,
}: GuestV2HeroProps) {
  return (
    <section className="overflow-hidden rounded-[2.25rem] bg-white shadow-sm ring-1 ring-black/5">
      <div className="relative h-40 bg-gradient-to-br from-[#d8c5a7] via-[#efe2cf] to-[#9eb6b8]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.65),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.45),transparent_26%),linear-gradient(to_top,rgba(0,0,0,0.42),transparent_58%)]" />

        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-sm font-medium text-white/80">
            {propertyLocation}
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
            Welcome, {guestName} 👋
          </h1>
        </div>
      </div>

      <div className="p-5">
        <p className="text-sm leading-6 text-black/60">
          Enjoy your stay at{" "}
          <span className="font-semibold text-black">{propertyName}</span>.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
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