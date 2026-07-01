type GuestV2SectionHeroProps = {
  title: string;
  icon: string;
  eyebrow: string;
  intro: string;
  propertyLocation: string;
};

export function GuestV2SectionHero({
  title,
  icon,
  eyebrow,
  intro,
  propertyLocation,
}: GuestV2SectionHeroProps) {
  return (
    <section className="overflow-hidden rounded-[2.25rem] bg-white shadow-sm ring-1 ring-black/5">
      <div className="relative h-36 bg-gradient-to-br from-[#d8c5a7] via-[#efe2cf] to-[#9eb6b8]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.65),transparent_30%),linear-gradient(to_top,rgba(0,0,0,0.42),transparent_58%)]" />

        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-sm font-medium text-white/80">
            {propertyLocation}
          </p>

          <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold tracking-tight text-white">
            <span>{icon}</span>
            <span>{title}</span>
          </h1>
        </div>
      </div>

      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-black/35">
          {eyebrow}
        </p>

        <p className="mt-2 text-sm leading-6 text-black/60">{intro}</p>
      </div>
    </section>
  );
}