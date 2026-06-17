"use client";

export function DashboardSidebar({
  activeTab,
  onSelectTab,
}: {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}) {
  return (
    <aside className="space-y-3">
      <button
        onClick={() => onSelectTab("general")}
        className={`w-full text-left px-5 py-4 rounded-2xl transition ${
          activeTab === "general"
            ? "bg-black text-white shadow-xl"
            : "bg-white border border-gray-200"
        }`}
      >
        🏡 General
      </button>

      <button
        onClick={() => onSelectTab("guestpage")}
        className={`w-full text-left px-5 py-4 rounded-2xl transition ${
          activeTab === "guestpage"
            ? "bg-black text-white shadow-xl"
            : "bg-white border border-gray-200"
        }`}
      >
        ✨ Guest Page
      </button>

      <button
        onClick={() => onSelectTab("welcomebook")}
        className={`w-full text-left px-5 py-4 rounded-2xl transition ${
          activeTab === "welcomebook"
            ? "bg-black text-white shadow-xl"
            : "bg-white border border-gray-200"
        }`}
      >
        📘 Welcome Book
      </button>

      <button
        onClick={() => onSelectTab("extraservices")}
        className={`w-full text-left px-5 py-4 rounded-2xl transition ${
          activeTab === "extraservices"
            ? "bg-black text-white shadow-xl"
            : "bg-white border border-gray-200"
        }`}
      >
        🛎️ Extra Services
      </button>

      <button
        onClick={() => onSelectTab("localguide")}
        className={`w-full text-left px-5 py-4 rounded-2xl transition ${
          activeTab === "localguide"
            ? "bg-black text-white shadow-xl"
            : "bg-white border border-gray-200"
        }`}
      >
        📍 Local Guide
      </button>

      <button
        onClick={() => onSelectTab("ai")}
        className={`w-full text-left px-5 py-4 rounded-2xl transition ${
          activeTab === "ai"
            ? "bg-black text-white shadow-xl"
            : "bg-white border border-gray-200"
        }`}
      >
        🤖 AI Training
      </button>

      <a
        href="/dashboard/qr"
        className="w-full block text-left px-5 py-4 rounded-2xl transition bg-white border border-gray-200 hover:bg-black hover:text-white"
      >
        📲 Guest Access QR/NFC
      </a>

      <a
        href="/dashboard/inbox"
        className="w-full block text-left px-5 py-4 rounded-2xl transition bg-white border border-gray-200 hover:bg-black hover:text-white"
      >
        💬 Inbox
      </a>

      <a
        href="/dashboard/issues"
        className="w-full block text-left px-5 py-4 rounded-2xl transition bg-white border border-gray-200 hover:bg-black hover:text-white"
      >
        🚨 Issues
      </a>

      <a
        href="/dashboard/notifications"
        className="w-full block text-left px-5 py-4 rounded-2xl transition bg-white border border-gray-200 hover:bg-black hover:text-white"
      >
        🔔 Notifications
      </a>

      <a
        href="/dashboard/cleaning"
        className="w-full block text-left px-5 py-4 rounded-2xl transition bg-white border border-gray-200 hover:bg-black hover:text-white"
      >
        🧹 Cleaning
      </a>

      <a
        href="/dashboard/channel-manager"
        className="w-full block text-left px-5 py-4 rounded-2xl transition bg-white border border-gray-200 hover:bg-black hover:text-white"
      >
        📅 Light Channel Manager
      </a>

      <a
        href="/dashboard/billing"
        className="w-full block text-left px-5 py-4 rounded-2xl transition bg-white border border-gray-200 hover:bg-black hover:text-white"
      >
        💳 Billing
      </a>

      <a
        href="/logout"
        className="w-full block text-left px-5 py-4 rounded-2xl transition bg-white border border-red-100 text-red-600 hover:bg-red-600 hover:text-white"
      >
        🚪 Logout
      </a>
    </aside>
  );
}