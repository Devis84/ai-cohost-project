import type { ReactNode } from 'react'

export default function GuestLayout({ children }: { children: ReactNode }) {
  return <div className="guest-theme">{children}</div>
}
