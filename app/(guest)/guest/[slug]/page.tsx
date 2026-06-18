import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/supabase-server'
import { GuestPageTemplate } from '@/components/templates/GuestPageTemplate'
import type { Property } from '@/types/guest'

type PageProps = {
  params: Promise<{ slug: string }>
}

async function findProperty(identifier: string): Promise<Property | null> {
  const clean = decodeURIComponent(identifier).trim()

  if (!clean) {
    return null
  }

  const { data: bySlug } = await supabaseServer
    .from('properties')
    .select('*')
    .eq('slug', clean)
    .maybeSingle()

  if (bySlug) {
    return bySlug as Property
  }

  const { data: byId } = await supabaseServer
    .from('properties')
    .select('*')
    .eq('id', clean)
    .maybeSingle()

  if (byId) {
    return byId as Property
  }

  const { data: byName } = await supabaseServer
    .from('properties')
    .select('*')
    .eq('property_name', clean)
    .maybeSingle()

  if (byName) {
    return byName as Property
  }

  return null
}

export default async function GuestPage({ params }: PageProps) {
  const { slug } = await params

  const property = await findProperty(slug)

  if (!property) {
    notFound()
  }

  return <GuestPageTemplate property={property} />
}
