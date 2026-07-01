 type GuestV2TodayCardProps = {
  title: string;
  subtitle: string;
  progressLabel: string;
  progressPercent: number;
  items: {
    icon: string;
    label: string;
  }[];
};

export function GuestV2TodayCard({
  title,
  subtitle,
  progressLabel,
  progressPercent,
  items,
}: GuestV2TodayCardProps) {
  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-xs font-semibold uppercase tracking-wide text-black/35">
        Today&apos;s stay
      </p>

      <h2 className="mt-2 text-xl font-bold">{title}</h2>

      <p className="mt-1 text-sm leading-6 text-black/55">{subtitle}</p>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-black/40">
            {progressLabel}
          </p>

          <p className="text-xs font-bold text-black/50">
            {Math.round(progressPercent)}%
          </p>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-[#f6f1e8]">
          <div
            className="h-full rounded-full bg-black"
            style={{
              width: `${Math.min(Math.max(progressPercent, 0), 100)}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f6f1e8] text-sm">
              {item.icon}
            </span>

            <p className="text-sm font-semibold">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}