 import Link from "next/link";

type GuestV2HeaderProps = {
  token: string;
  hostWhatsappUrl: string;
};

export function GuestV2Header({ token, hostWhatsappUrl }: GuestV2HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f6f1e8]/98 px-4 py-3 backdrop-blur">
      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`/guest-v2/${token}/ai`}
          className="rounded-full bg-black px-4 py-3 text-center text-sm font-bold text-white shadow-md transition active:scale-[0.98] active:shadow-lg"
        >
          💬 Chat AI
        </Link>

        <a
          href={hostWhatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-[#25D366] px-4 py-3 text-center text-sm font-bold text-white shadow-md transition active:scale-[0.98] active:shadow-lg"
        >
          🟢 WhatsApp
        </a>
      </div>
    </header>
  );
}