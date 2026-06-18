type GuestAccessToken = {
  id: string;
  property_id: string | null;
  property_slug: string;
  stay_id: string | null;
  booking_id: string | null;
  source: string;
  external_event_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  guest_contact: string | null;
  token: string;
  guest_access_url: string;
  checkin_date: string | null;
  checkout_date: string | null;
  valid_from: string;
  valid_until: string;
  status: string;
  access_level: string;
  last_used_at: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type GuestAccessValidateResponse = {
  success: boolean;
  allowed: boolean;
  state: string;
  reason?: string;
  error?: string;
  token?: GuestAccessToken;
};

type GuestAccessPageProps = {
  params: Promise<{
    token: string;
  }>;
};

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://ai-cohost-project.vercel.app"
  ).replace(/\/$/, "");
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat("en", {
      weekday: "short",
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(new Date(`${value}T12:00:00.000Z`));
  } catch {
    return value;
  }
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getPropertyDisplayName(propertySlug?: string | null) {
  if (propertySlug === "maltese-maisonette") {
    return "Maltese Maisonette";
  }

  if (!propertySlug) {
    return "Your stay";
  }

  return propertySlug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function validateGuestAccess(
  token: string
): Promise<GuestAccessValidateResponse> {
  const response = await fetch(`${getSiteUrl()}/api/guest-access/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      token,
      mark_used: true,
    }),
  });

  if (!response.ok) {
    return {
      success: false,
      allowed: false,
      state: "server_error",
      error: "Unable to validate this guest access link.",
    };
  }

  return response.json();
}

function StatusCard({
  title,
  message,
  emoji,
  tone = "neutral",
}: {
  title: string;
  message: string;
  emoji: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-100 bg-emerald-50 text-emerald-900"
      : tone === "warning"
        ? "border-amber-100 bg-amber-50 text-amber-900"
        : tone === "danger"
          ? "border-red-100 bg-red-50 text-red-900"
          : "border-zinc-100 bg-white text-zinc-950";

  return (
    <div className={`rounded-[34px] border p-7 shadow-sm ${toneClass}`}>
      <div className="text-5xl">{emoji}</div>
      <h1 className="mt-5 text-4xl font-black tracking-tight">{title}</h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed opacity-75">
        {message}
      </p>
    </div>
  );
}

function StayInfoCard({ token }: { token: GuestAccessToken }) {
  const propertyName = getPropertyDisplayName(token.property_slug);

  return (
    <section className="rounded-[34px] border border-black/5 bg-white p-7 shadow-sm">
      <div className="text-xs font-black uppercase tracking-[0.24em] text-zinc-400">
        Your stay
      </div>

      <h2 className="mt-3 text-3xl font-black text-zinc-950">
        {propertyName}
      </h2>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-zinc-50 p-5">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
            Guest
          </div>
          <div className="mt-2 text-xl font-black text-zinc-950">
            {token.guest_name || "Guest"}
          </div>
        </div>

        <div className="rounded-3xl bg-zinc-50 p-5">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
            Access status
          </div>
          <div className="mt-2 text-xl font-black text-emerald-700">
            Active
          </div>
        </div>

        <div className="rounded-3xl bg-zinc-50 p-5">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
            Check-in
          </div>
          <div className="mt-2 text-xl font-black text-zinc-950">
            {formatDate(token.checkin_date)}
          </div>
        </div>

        <div className="rounded-3xl bg-zinc-50 p-5">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
            Check-out
          </div>
          <div className="mt-2 text-xl font-black text-zinc-950">
            {formatDate(token.checkout_date)}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-sm leading-relaxed text-emerald-800">
        Your digital stay access is active. Full guest services can be
        connected here, including the welcome guide, house information and AI
        Concierge.
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <a
          href={`/guest/${token.property_slug}`}
          className="rounded-2xl bg-black px-5 py-4 text-center font-black text-white shadow-sm"
        >
          Open Guest Page
        </a>

        <a
          href="/dashboard"
          className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-center font-black text-zinc-950 shadow-sm"
        >
          Contact Host
        </a>
      </div>

      <div className="mt-5 text-xs leading-relaxed text-zinc-400">
        Access valid from {formatDateTime(token.valid_from)} until{" "}
        {formatDateTime(token.valid_until)}.
      </div>
    </section>
  );
}

export default async function GuestAccessPage({
  params,
}: GuestAccessPageProps) {
  const { token } = await params;
  const validation = await validateGuestAccess(token);

  const guestToken = validation.token;
  const propertyName = getPropertyDisplayName(guestToken?.property_slug);

  return (
    <main className="min-h-screen bg-[#f4f1eb] px-4 py-6 text-zinc-950 md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-[38px] border border-black/5 bg-white p-7 shadow-sm md:p-9">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">
            AI Co-Host Guest Access
          </div>

          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            {propertyName}
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-500 md:text-lg">
            Your personal digital access for this stay.
          </p>
        </header>

        {validation.allowed && guestToken ? (
          <StayInfoCard token={guestToken} />
        ) : validation.state === "not_active_yet" ? (
          <StatusCard
            emoji="⏳"
            tone="warning"
            title="Access not active yet"
            message={
              validation.reason ||
              "This guest access is not active yet. Please check your arrival details or contact the host."
            }
          />
        ) : validation.state === "expired" ? (
          <StatusCard
            emoji="🔒"
            tone="neutral"
            title="Access expired"
            message={
              validation.reason ||
              "This guest access has expired because the stay has ended."
            }
          />
        ) : validation.state === "revoked" ? (
          <StatusCard
            emoji="🚫"
            tone="danger"
            title="Access revoked"
            message={
              validation.reason ||
              "This guest access is no longer available. Please contact the host if you need assistance."
            }
          />
        ) : (
          <StatusCard
            emoji="❌"
            tone="danger"
            title="Invalid access link"
            message={
              validation.error ||
              validation.reason ||
              "This guest access link could not be verified."
            }
          />
        )}
      </div>
    </main>
  );
}