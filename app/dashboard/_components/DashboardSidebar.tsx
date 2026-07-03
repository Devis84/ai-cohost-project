 "use client";

import type { ReactNode } from "react";

import LogoutSwitchAccountButton from "./LogoutSwitchAccountButton";

type DashboardSidebarProps = {

  activeTab: string;

  onSelectTab: (tab: string) => void;

};

function TabButton({

  icon,

  label,

  tab,

  activeTab,

  onSelectTab,

}: {

  icon: string;

  label: string;

  tab: string;

  activeTab: string;

  onSelectTab: (tab: string) => void;

}) {

  const isActive = activeTab === tab;

  return (

    <button

      type="button"

      onClick={() => onSelectTab(tab)}

      className={`w-full text-left px-5 py-4 rounded-2xl transition ${

        isActive

          ? "bg-black text-white shadow-xl"

          : "bg-white border border-gray-200 hover:bg-black hover:text-white"

      }`}

    >

      {icon} {label}

    </button>

  );

}

function SidebarLink({

  href,

  icon,

  label,

  danger = false,

}: {

  href: string;

  icon: string;

  label: string;

  danger?: boolean;

}) {

  return (

    <a

      href={href}

      className={`w-full block text-left px-5 py-4 rounded-2xl transition border ${

        danger

          ? "bg-white border-red-100 text-red-600 hover:bg-red-600 hover:text-white"

          : "bg-white border-gray-200 hover:bg-black hover:text-white"

      }`}

    >

      {icon} {label}

    </a>

  );

}

function SidebarSection({

  title,

  children,

}: {

  title: string;

  children: ReactNode;

}) {

  return (

    <div className="space-y-3">

      <div className="px-2 pt-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">

        {title}

      </div>

      {children}

    </div>

  );

}

export function DashboardSidebar({

  activeTab,

  onSelectTab,

}: DashboardSidebarProps) {

  return (

    <aside className="space-y-5">

      <SidebarSection title="Property Setup">

        <TabButton

          icon="🏡"

          label="General"

          tab="general"

          activeTab={activeTab}

          onSelectTab={onSelectTab}

        />

        <TabButton

          icon="✨"

          label="Guest Page"

          tab="guestpage"

          activeTab={activeTab}

          onSelectTab={onSelectTab}

        />

        <SidebarLink

          href="/dashboard/qr"

          icon="📲"

          label="Guest Access QR/NFC"

        />

        <SidebarLink

          href="/dashboard/guest-access"

          icon="🔑"

          label="Guest Stay Access"

        />

        <SidebarLink

          href="/dashboard/activity"

          icon="📊"

          label="Guest Activity"

        />

      </SidebarSection>

      <SidebarSection title="Guest Content">

        <TabButton

          icon="📘"

          label="Welcome Book"

          tab="welcomebook"

          activeTab={activeTab}

          onSelectTab={onSelectTab}

        />

        <TabButton

          icon="📍"

          label="Local Guide"

          tab="localguide"

          activeTab={activeTab}

          onSelectTab={onSelectTab}

        />

        <TabButton

          icon="🛎️"

          label="Extra Services"

          tab="extraservices"

          activeTab={activeTab}

          onSelectTab={onSelectTab}

        />

        <TabButton

          icon="🤖"

          label="AI Training"

          tab="ai"

          activeTab={activeTab}

          onSelectTab={onSelectTab}

        />

      </SidebarSection>

      <SidebarSection title="Guest Operations">

        <SidebarLink

          href="/dashboard/bookings"

          icon="📅"

          label="Bookings & Stays"

        />

        <SidebarLink

          href="/dashboard/calendar"

          icon="📆"

          label="Calendar"

        />

        <SidebarLink

          href="/dashboard/inbox"

          icon="💬"

          label="Inbox"

        />

        <SidebarLink

          href="/dashboard/conversations"

          icon="🧾"

          label="Conversations"

        />

        <SidebarLink

          href="/dashboard/issues"

          icon="🚨"

          label="Issues"

        />

        <SidebarLink

          href="/dashboard/notifications"

          icon="🔔"

          label="Notifications"

        />

        <SidebarLink

          href="/dashboard/cleaning"

          icon="🧹"

          label="Cleaning"

        />

      </SidebarSection>

      <SidebarSection title="Insights & Reports">

        <SidebarLink

          href="/dashboard/analytics"

          icon="📊"

          label="Analytics"

        />

      </SidebarSection>

      <SidebarSection title="Business">

        <SidebarLink

          href="/dashboard/channel-manager"

          icon="📅"

          label="Light Channel Manager"

        />

        <SidebarLink

          href="/dashboard/billing"

          icon="💳"

          label="Billing"

        />

      </SidebarSection>

      <SidebarSection title="Account">

        <LogoutSwitchAccountButton />

      </SidebarSection>

    </aside>

  );

}