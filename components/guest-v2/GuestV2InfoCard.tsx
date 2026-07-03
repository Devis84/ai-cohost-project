type GuestV2InfoCardProps = {
  icon: string;
  title: string;
  body: string;
};

export function GuestV2InfoCard({ icon, title, body }: GuestV2InfoCardProps) {
  return (
    <article className="rounded-[1.5rem] bg-white p-5 shadow-md ring-1 ring-black/5 transition active:scale-[0.98]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#f6f1e8] to-[#ede8e0] text-2xl shadow-sm">
          {icon}
        </div>

        <div>
          <h2 className="text-base font-black text-black">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-black/60">{body}</p>
        </div>
      </div>
    </article>
  );
}