 "use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirect =
    searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success"
  >("idle");

  async function login() {
    const cleanEmail = email.trim().toLowerCase();

    setError("");

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch("/api/auth/email-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Login failed. Please try again."
        );
      }

      setStatus("success");
      router.push(redirect);
      router.refresh();
    } catch (error) {
      setStatus("idle");
      setError(
        error instanceof Error
          ? error.message
          : "Login failed. Please try again."
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4">
      <div className="bg-white rounded-[32px] shadow-xl border border-black/5 p-8 w-full max-w-md">
        <div className="mb-8">
          <div className="uppercase tracking-[0.3em] text-xs text-gray-400 mb-4">
            AI CO-HOST
          </div>

          <h1 className="text-3xl font-bold mb-2">
            Dashboard Login
          </h1>

          <p className="text-gray-500 leading-relaxed">
            Enter the email authorized by the admin to access your host or
            partner dashboard.
          </p>
        </div>

        <div className="space-y-4">
          <input
            className="w-full border border-gray-200 rounded-2xl p-4"
            placeholder="Email"
            type="email"
            autoComplete="email"
            value={email}
            disabled={status === "loading"}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                login();
              }
            }}
          />

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 text-sm leading-relaxed">
              {error}
            </div>
          )}

          {status === "success" && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl p-4 text-sm leading-relaxed">
              Login successful. Redirecting to your dashboard...
            </div>
          )}

          <button
            type="button"
            onClick={login}
            disabled={status === "loading"}
            className="w-full bg-black text-white rounded-2xl p-4 font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "loading"
              ? "Checking access..."
              : "Continue"}
          </button>

          <p className="text-xs leading-relaxed text-gray-400">
            Access is limited to emails already authorized by the admin.
            No password is required for this MVP test version.
          </p>
        </div>
      </div>
    </div>
  );
}