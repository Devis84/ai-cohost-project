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
    <section className="rounded-[2rem] bg-gradient-to-br from-white to-[#faf8f5] p-6 shadow-md ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-black/35">
            Today's Stay
          </p>

          <h2 className="mt-2 text-2xl font-black leading-tight text-black">
            {title}
          </h2>

          <p className="mt-1 text-sm text-black/60">
            {subtitle}
          </p>
        </div>

        <div className="rounded-[1.5rem] bg-black/5 px-4 py-3 text-center">
          <div className="text-xs font-semibold text-black/50">
            Progress
          </div>

          <div className="mt-1 text-2xl font-black text-black">
            {progressPercent}%
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-full bg-black/8">
        <div
          className="h-2 rounded-full bg-black transition-all duration-500 ease-out"
          style={{
            width: `${progressPercent}%`,
          }}
        />
      </div>

      <p className="mt-3 text-sm font-medium text-black/60">
        {progressLabel}
      </p>

      <div className="mt-5 space-y-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm transition active:scale-[0.98]"
          >
            <span className="text-lg">{item.icon}</span>

            <span className="font-semibold text-black">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}