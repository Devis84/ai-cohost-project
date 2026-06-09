import type { ReactNode } from "react"
import { HostSidebar } from "./HostSidebar"

interface HostShellProps {
  children: ReactNode
}

export function HostShell({ children }: HostShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          <div className="hidden lg:block">
            <div className="sticky top-8">
              <HostSidebar />
            </div>
          </div>
          <main>{children}</main>
        </div>
      </div>
    </div>
  )
}
