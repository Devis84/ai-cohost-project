import type { ReactNode } from 'react'
import { SaaSNavbar } from '@/components/organisms/SaaSNavbar'
import { SaaSFooter } from '@/components/organisms/SaaSFooter'

export default function SaaSLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SaaSNavbar />
      <main className="flex-1">{children}</main>
      <SaaSFooter />
    </div>
  )
}
