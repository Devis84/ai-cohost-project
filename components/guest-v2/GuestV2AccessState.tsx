type GuestV2AccessStateProps = {
  title: string;
  message: string;
  stateLabel: string;
  whatsappUrl: string;
};

export function GuestV2AccessState({
  title,
  message,
  stateLabel,
  whatsappUrl,
}: GuestV2AccessStateProps) {
  return (
    <main className="min-h-screen bg-[#f6f1e8] px-4 py-6 text-[#171717]">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center">
        <section className="overflow-hidden rounded-[2.25rem] bg-white shadow-sm ring-1 ring-black/5">
          <div className="relative h-44 bg-gradient-to-br from-[#d8c5a7] via-[#efe2cf] to-[#9eb6b8]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.65),transparent_30%),linear-gradient(to_top,rgba(0,0,0,0.5),transparent_62%)]" />

            <div className="absolute bottom-5 left-5 right-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/65">
                {stateLabel}
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                {title}
              </h1>
            </div>
          </div>

          <div className="p-5">
            <p className="text-sm leading-6 text-black/60">{message}</p>

            <div className="mt-5 grid grid-cols-1 gap-2">
              {whatsappUrl !== "#" ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-black px-4 py-3 text-center text-sm font-semibold text-white shadow-sm active:scale-[0.98]"
                >
                  🟢 Contact host on WhatsApp
                </a>
              ) : null}

              <p className="text-center text-xs leading-5 text-black/35">
                If you believe this is a mistake, please contact your host.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}