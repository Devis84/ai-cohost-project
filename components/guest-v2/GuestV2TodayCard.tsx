 type TodayItem = {
  icon: string;
  label: string;
};

type GuestV2TodayCardProps = {
  title: string;
  subtitle: string;
  progressLabel: string;
  progressPercent: number;
  items: TodayItem[];
};

export function GuestV2TodayCard({
  title,
  subtitle,
  progressLabel,
  progressPercent,
  items,
}: GuestV2TodayCardProps) {
  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
            TODAY&apos;S STAY
          </p>

          <h2 className="mt-2 text-2xl font-black text-neutral-900">
            {title}
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            {subtitle}
          </p>
        </div>

        <div className="rounded-2xl bg-[#F4F1EA] px-4 py-3 text-right">
          <div className="text-xs text-neutral-500">
            Stay Progress
          </div>

          <div className="text-lg font-black">
            {progressPercent}%
          </div>
        </div>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-black transition-all"
          style={{
            width: `${progressPercent}%`,
          }}
        />
      </div>

      <p className="mt-2 text-sm font-medium text-neutral-600">
        {progressLabel}
      </p>

      <div className="mt-6 grid gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-2xl bg-neutral-50 px-4 py-3"
          >
            <span className="text-xl">{item.icon}</span>

            <span className="font-medium">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}