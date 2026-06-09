"use client"

import { usePathname } from "next/navigation"
import { NavItem } from "@/components/molecules/NavItem"
import {
  Home, QrCode, MessageCircle, AlertTriangle,
  Bell, Brush, CreditCard, LogOut,
} from "lucide-react"

const NAV_ITEMS = [
  { label: "Dashboard", icon: Home, href: "/dashboard" },
  { label: "Guest Access QR/NFC", icon: QrCode, href: "/dashboard/qr" },
  { label: "Inbox", icon: MessageCircle, href: "/dashboard/inbox" },
  { label: "Issues", icon: AlertTriangle, href: "/dashboard/issues" },
  { label: "Notifications", icon: Bell, href: "/dashboard/notifications" },
  { label: "Cleaning", icon: Brush, href: "/dashboard/cleaning" },
  { label: "Billing", icon: CreditCard, href: "/dashboard/billing" },
] as const

export function HostSidebar() {
  const pathname = usePathname()

  return (
    <aside className="space-y-2">
      {NAV_ITEMS.map((item) => (
        <NavItem
          key={item.href}
          label={item.label}
          icon={<item.icon size={20} />}
          href={item.href}
          isActive={
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href)
          }
        />
      ))}

      <div className="pt-4">
        <NavItem
          label="Logout"
          icon={<LogOut size={20} />}
          href="/logout"
          variant="danger"
        />
      </div>
    </aside>
  )
}
