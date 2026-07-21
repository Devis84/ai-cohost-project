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
    <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-black to-[#1a1a1a] p-6 text-white shadow-lg">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 text-3xl shadow-md">
          {icon}
        </div>

        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/50">
            {eyebrow}
          </p>

          <h2 className="mt-2 text-xl font-black leading-tight">
            {title}
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-white/75">
            {body}
          </p>
        </div>
      </div>
    </section>
  );
}