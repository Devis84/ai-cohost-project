import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createAuthClient } from '@/lib/supabase/server'
import { HostShell } from '@/components/organisms/HostShell'

export default async function HostLayout({ children }: { children: ReactNode }) {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <HostShell>{children}</HostShell>
}
