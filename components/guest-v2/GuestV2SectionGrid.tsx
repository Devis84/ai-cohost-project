 import Link from "next/link";

export type GuestV2SectionItem = {
  title: string;
  icon: string;
  slug: string;
};

type GuestV2SectionGridProps = {
  token: string;
  sections: GuestV2SectionItem[];
  checkoutTime: string;
};

export function GuestV2SectionGrid({
  token,
  sections,
  checkoutTime,
}: GuestV2SectionGridProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-black/35">
            Quick actions
          </p>
          <h2 className="mt-1 text-lg font-bold">What do you need?</h2>
        </div>

        <p className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-black/45 shadow-sm ring-1 ring-black/5">
          Checkout {checkoutTime}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {sections.map((section) => (
          <Link
            key={section.slug}
            href={`/guest-v2/${token}/section/${section.slug}`}
            className="group flex min-h-28 flex-col justify-between rounded-[1.75rem] bg-white p-4 shadow-sm ring-1 ring-black/5 transition active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="text-3xl">{section.icon}</div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f6f1e8] text-sm text-black/50 transition group-active:translate-x-0.5">
                →
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold">{section.title}</h3>
              <p className="mt-1 text-xs font-medium text-black/35">
                Open section
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}