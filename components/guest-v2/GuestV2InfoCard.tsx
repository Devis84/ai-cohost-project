type GuestV2InfoCardProps = {
  icon: string;
  title: string;
  body: string;
};

export function GuestV2InfoCard({ icon, title, body }: GuestV2InfoCardProps) {
  return (
    <article className="rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f6f1e8] text-2xl">
          {icon}
        </div>

        <div>
          <h2 className="text-base font-bold">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-black/60">{body}</p>
        </div>
      </div>
    </article>
  );
}