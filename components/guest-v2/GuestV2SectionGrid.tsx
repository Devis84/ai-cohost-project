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
  wifi: "Network & password",
  "house-guide": "Rules & appliances",
  food: "Restaurants & delivery",
  transport: "Taxi • Bus • Airport",
  "local-guide": "Places nearby",
  emergency: "Support contacts",
  "extra-services": "Add-ons & services",
};

export function GuestV2SectionGrid({
  token,
  sections,
  checkoutTime,
}: GuestV2SectionGridProps) {
  // Prioritize WiFi and emergency sections
  const prioritySlugs = ["wifi", "house-guide", "emergency"];
  const sortedSections = [
    ...sections.filter((s) => prioritySlugs.includes(s.slug)),
    ...sections.filter((s) => !prioritySlugs.includes(s.slug)),
  ];

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-black/30">
            Quick Access
          </p>

          <h2 className="mt-1 text-2xl font-black text-black">
            What do you need?
          </h2>
        </div>

        <div className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black/50 shadow-sm ring-1 ring-black/5">
          Checkout {checkoutTime}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {sortedSections.map((section) => (
          <Link
            key={section.slug}
            href={`/guest-v2/${token}/section/${section.slug}`}
            className="group flex min-h-36 flex-col justify-between rounded-[1.75rem] bg-white p-4 shadow-md ring-1 ring-black/5 transition active:scale-[0.98] active:shadow-lg"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#f6f1e8] to-[#ede8e0] text-3xl shadow-sm">
                {section.icon}
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-black text-white transition group-active:translate-x-0.5">
                →
              </div>
            </div>

            <div>
              <h3 className="text-base font-black leading-tight text-black">
                {section.title}
              </h3>

              <p className="mt-1.5 text-xs font-medium leading-tight text-black/50">
                {sectionCopy[section.slug] || "Open section"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}