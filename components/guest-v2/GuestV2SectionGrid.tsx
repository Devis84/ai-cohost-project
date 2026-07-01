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
        <h2 className="text-lg font-bold">Your stay</h2>
        <p className="text-xs font-medium text-black/35">
          Checkout {checkoutTime}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {sections.map((section) => (
          <Link
            key={section.slug}
            href={`/guest-v2/${token}/section/${section.slug}`}
            className="flex min-h-28 flex-col justify-between rounded-[1.65rem] bg-white p-4 shadow-sm ring-1 ring-black/5 transition active:scale-[0.98]"
          >
            <div className="text-3xl">{section.icon}</div>

            <div>
              <h3 className="text-base font-bold">{section.title}</h3>
              <p className="mt-1 text-xs font-medium text-black/35">
                Tap to open
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}