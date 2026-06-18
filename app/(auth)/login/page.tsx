 import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4">
          <div className="bg-white rounded-[32px] shadow-xl border border-black/5 p-8 w-full max-w-md">
            Loading login...
          </div>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}