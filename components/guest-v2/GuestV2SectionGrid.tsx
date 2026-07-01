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

const sectionCopy: Record<string, string> = {
  wifi: "Password & QR code",
  "house-guide": "Everything you need",
  food: "Restaurants & delivery",
  transport: "Taxi • Bus • Airport",
  "local-guide": "Places nearby",
  emergency: "Contacts & support",
  "extra-services": "Late checkout & add-ons",
};

export function GuestV2SectionGrid({
  token,
  sections,
  checkoutTime,
}: GuestV2SectionGridProps) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-black/30">
            Quick Actions
          </p>

          <h2 className="mt-1 text-xl font-black text-black">
            What do you need?
          </h2>
        </div>

        <p className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-black/45 shadow-sm ring-1 ring-black/5">
          Checkout {checkoutTime}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {sections.map((section) => (
          <Link
            key={section.slug}
            href={`/guest-v2/${token}/section/${section.slug}`}
            className="group flex min-h-32 flex-col justify-between rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-black/5 transition active:scale-[0.98]"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f6f1e8] text-3xl">
                {section.icon}
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-sm font-black text-white transition group-active:translate-x-0.5">
                →
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black leading-tight">
                {section.title}
              </h3>

              <p className="mt-1 text-sm font-medium leading-tight text-black/45">
                {sectionCopy[section.slug] || "Open section"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}