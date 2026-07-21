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
    <section className="overflow-hidden rounded-[2.25rem] bg-white shadow-lg ring-1 ring-black/5">
      <div className="relative h-40 bg-gradient-to-br from-[#d8c5a7] via-[#efe2cf] to-[#9eb6b8]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.7),transparent_35%),linear-gradient(to_top,rgba(0,0,0,0.5),transparent_60%)]" />

        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-sm font-semibold text-white/85">
            {propertyLocation}
          </p>

          <h1 className="mt-2 flex items-center gap-3 text-3xl font-black tracking-tight text-white drop-shadow">
            <span className="text-4xl">{icon}</span>
            <span>{title}</span>
          </h1>
        </div>
      </div>

      <div className="p-6">
        <p className="text-xs font-black uppercase tracking-[0.15em] text-black/40">
          {eyebrow}
        </p>

        <p className="mt-3 text-sm leading-relaxed text-black/65">{intro}</p>
      </div>
    </section>
  );
}