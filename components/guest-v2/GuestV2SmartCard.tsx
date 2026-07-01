 type GuestV2SmartCardProps = {
  icon: string;
  eyebrow: string;
  title: string;
  body: string;
};

export function GuestV2SmartCard({
  icon,
  eyebrow,
  title,
  body,
}: GuestV2SmartCardProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] bg-black p-5 text-white shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl">
          {icon}
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
            {eyebrow}
          </p>

          <h2 className="mt-2 text-2xl font-black leading-tight">
            {title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/70">
            {body}
          </p>
        </div>
      </div>
    </section>
  );
}