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
        className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs font-semibold text-gray-900 transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
      className="w-full text-left px-5 py-4 rounded-2xl transition border bg-white border-gray-200 text-gray-950 hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex items-center justify-between gap-3">
        <span>
          🚪 {loading ? "Logging out..." : "Logout / Switch account"}
        </span>

        <span className="text-gray-400 group-hover:text-white">
          ↪
        </span>
      </span>
    </button>
  );
}