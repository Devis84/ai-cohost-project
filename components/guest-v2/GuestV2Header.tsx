import Link from "next/link";

type GuestV2HeaderProps = {
  token: string;
  hostWhatsappUrl: string;
};

export function GuestV2Header({ token, hostWhatsappUrl }: GuestV2HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f6f1e8]/95 px-4 py-3 backdrop-blur">
      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`/guest-v2/${token}`}
          className="rounded-full bg-black px-4 py-3 text-center text-sm font-semibold text-white shadow-sm active:scale-[0.98]"
        >
          💬 AI Concierge
        </Link>

        <a
          href={hostWhatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-white px-4 py-3 text-center text-sm font-semibold text-black shadow-sm ring-1 ring-black/10 active:scale-[0.98]"
        >
          🟢 WhatsApp Host
        </a>
      </div>
    </header>
  );
}