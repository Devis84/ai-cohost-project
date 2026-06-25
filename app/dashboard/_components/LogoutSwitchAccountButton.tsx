"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LogoutSwitchAccountButtonProps = {
  compact?: boolean;
};

export default function LogoutSwitchAccountButton({
  compact = false,
}: LogoutSwitchAccountButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);

    try {
      await fetch("/api/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }

    router.push("/login");
    router.refresh();
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={logout}
        disabled={loading}
        className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-semibold text-white/80 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Logging out..." : "Logout"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-left text-sm font-semibold text-white/85 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span>
        {loading ? "Logging out..." : "Logout / Switch account"}
      </span>

      <span className="text-white/45">↪</span>
    </button>
  );
}