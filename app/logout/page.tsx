"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function logout() {
      try {
        await fetch("/api/logout", {
          method: "POST",
        });
      } catch (error) {
        console.error("LOGOUT ERROR:", error);
      } finally {
        router.replace("/login");
      }
    }

    logout();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4">
      <div className="bg-white rounded-[32px] shadow-xl border border-black/5 p-8 w-full max-w-md text-center">
        <div className="uppercase tracking-[0.3em] text-xs text-gray-400 mb-4">
          AI CO-HOST
        </div>

        <h1 className="text-3xl font-bold mb-3">
          Logging out
        </h1>

        <p className="text-gray-500">
          Please wait while we close your session.
        </p>
      </div>
    </div>
  );
}