 import { createClient } from '@supabase/supabase-js'
import AIConciergeCard from '@/components/AIConciergeCard'
import NearbyPlaces from '@/components/NearbyPlaces'
import QuickActions from '@/components/QuickActions'
import SectionTitle from '@/components/SectionTitle'
import WifiCard from '@/components/WifiCard'
import AccordionCard from '@/components/AccordionCard'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
)

export default async function WelcomePage({
  params,
}: {
  params: Promise<{ property: string }>
}) {

  const resolvedParams = await params

  const propertySlug = decodeURIComponent(
    resolvedParams.property
  )

  const { data: propertyData, error } = await supabase
    .from('properties')
    .select('*')
    .eq('slug', propertySlug)
    .maybeSingle()

  if (error || !propertyData) {

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] p-10">

        <div className="bg-white p-10 rounded-[32px] shadow-2xl text-center max-w-md">

          <div className="text-6xl mb-5">
            🏡
          </div>

          <h1 className="text-3xl font-bold mb-4 text-gray-900">
            Property not found
          </h1>

          <p className="text-gray-500 leading-relaxed">
            The requested welcome page does not exist or is currently unavailable.
          </p>

        </div>

      </div>
    )
  }

  return (

    <div className="min-h-screen bg-[#f3f4f6]">

      {/* HERO */}

      <div className="relative h-[520px] w-full overflow-hidden">

        <img
          src={
            propertyData.image_url ||
            'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85'
          }
          alt={propertyData.property_name}
          className="h-full w-full object-cover scale-[1.02]"
        />

        {/* OVERLAY */}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />

        {/* TOP BAR */}

        <div className="absolute top-0 left-0 right-0 z-20 p-6">

          <div className="flex items-center justify-between">

            <div className="backdrop-blur-xl bg-white/10 border border-white/10 px-5 py-3 rounded-full text-white font-semibold shadow-xl">

              🏡 AI Co-Host

            </div>

            <div className="backdrop-blur-xl bg-white/10 border border-white/10 px-4 py-2 rounded-full text-white text-sm shadow-xl">

              ⭐ Premium Stay

            </div>

          </div>

        </div>

        {/* HERO CONTENT */}

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white z-10">

          <div className="flex flex-wrap gap-3 mb-6">

            <div className="bg-white/15 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full text-sm shadow-lg">
              ⭐ Guest Favorite
            </div>

            <div className="bg-white/15 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full text-sm shadow-lg">
              📶 Fast WiFi
            </div>

            <div className="bg-white/15 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full text-sm shadow-lg">
              🤖 AI Concierge
            </div>

            <div className="bg-white/15 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full text-sm shadow-lg">
              🔑 Self Check-in
            </div>

          </div>

          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-4 max-w-3xl">

            {propertyData.property_name}

          </h1>

          <div className="flex flex-wrap items-center gap-4 text-white/80">

            <p className="text-lg">
              📍 {propertyData.city || 'Unknown city'},
              {' '}
              {propertyData.country || 'Unknown country'}
            </p>

            <div className="w-1 h-1 bg-white/50 rounded-full" />

            <p className="text-lg">
              🛎️ Verified Host
            </p>

          </div>

          <p className="text-white/60 text-sm mt-4">
            {propertyData.address || ''}
          </p>

        </div>

      </div>

      {/* MAIN CONTENT */}

      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-16 relative z-20 pb-44">

        {/* WELCOME SECTION */}

        <div className="mb-10">

          <div className="bg-white rounded-[36px] p-8 shadow-2xl border border-gray-100">

            <SectionTitle
              eyebrow="WELCOME"
              title="Everything you need for your stay"
              subtitle="Quick access to directions, WiFi, self check-in and instant support during your experience."
            />

            <QuickActions
              address={propertyData.address}
              hostPhone={propertyData.host_phone}
            />

          </div>

        </div>

        {/* AI CONCIERGE */}

        <AIConciergeCard
          hostPhone={propertyData.host_phone}
        />

        {/* NEARBY PLACES */}

        <NearbyPlaces />

        {/* STAY ESSENTIALS */}

        <section className="mb-10">

          <SectionTitle
            eyebrow="STAY ESSENTIALS"
            title="Property essentials"
            subtitle="Everything you need to comfortably access and enjoy the property."
          />

          <div className="grid md:grid-cols-2 gap-6">

            {/* WIFI */}

            <WifiCard
              wifiName={propertyData.wifi_name}
              wifiPassword={propertyData.wifi_password}
            />

            {/* CHECK-IN */}

            <div className="bg-white rounded-[32px] p-8 shadow-xl border border-gray-100">

              <div className="flex items-center gap-4 mb-8">

                <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center text-3xl">

                  🔑

                </div>

                <div>

                  <h2 className="text-2xl font-bold text-gray-900">
                    Check-in
                  </h2>

                  <p className="text-gray-500 text-sm mt-1">
                    Self check-in available
                  </p>

                </div>

              </div>

              <div className="space-y-5 text-gray-700">

                <div className="bg-gray-50 rounded-2xl p-5">

                  <div className="text-sm text-gray-500 mb-2">
                    Check-in Time
                  </div>

                  <div className="font-semibold text-lg text-gray-900">

                    {propertyData.checkin_time || 'N/A'}

                  </div>

                </div>

                <div className="bg-gray-50 rounded-2xl p-5">

                  <div className="text-sm text-gray-500 mb-2">
                    Check-out Time
                  </div>

                  <div className="font-semibold text-lg text-gray-900">

                    {propertyData.checkout_time || 'N/A'}

                  </div>

                </div>

                <div className="bg-gray-50 rounded-2xl p-5">

                  <div className="text-sm text-gray-500 mb-3">
                    Instructions
                  </div>

                  <div className="whitespace-pre-line leading-relaxed text-gray-800">

                    {propertyData.checkin_instructions || 'N/A'}

                  </div>

                </div>

                <div className="bg-black text-white rounded-2xl p-5">

                  <div className="text-sm text-white/60 mb-2">
                    Lockbox Code
                  </div>

                  <div className="font-semibold text-2xl tracking-widest">

                    {propertyData.lockbox_code || 'N/A'}

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* PROPERTY GUIDE */}

        <section className="mb-10">

          <SectionTitle
            eyebrow="PROPERTY GUIDE"
            title="Important information"
            subtitle="House rules, local recommendations and useful information for your stay."
          />

          <div className="space-y-6">

            {/* HOUSE RULES */}

            <AccordionCard
              icon="📜"
              title="House Rules"
              content={propertyData.house_rules}
            />

            {/* LOCAL INFO */}

            <AccordionCard
              icon="📍"
              title="Local Information"
              content={propertyData.local_info}
            />

            {/* EMERGENCY */}

            <AccordionCard
              icon="🚨"
              title="Emergency Information"
              content={propertyData.emergency_info}
              danger
            />

          </div>

        </section>

      </div>

      {/* FLOATING BAR */}

      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[94%] max-w-xl bg-black/90 backdrop-blur-2xl text-white rounded-[28px] shadow-2xl px-7 py-4 flex items-center justify-between z-50 border border-white/10">

        <a
          href={`https://wa.me/${propertyData.host_phone || ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center text-xs hover:opacity-80 transition"
        >

          <span className="text-xl mb-1">
            💬
          </span>

          Chat

        </a>

        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(
            propertyData.address || ''
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center text-xs hover:opacity-80 transition"
        >

          <span className="text-xl mb-1">
            📍
          </span>

          Maps

        </a>

        <div className="flex flex-col items-center text-xs">

          <span className="text-xl mb-1">
            📶
          </span>

          WiFi

        </div>

        <a
          href="tel:112"
          className="flex flex-col items-center text-xs hover:opacity-80 transition"
        >

          <span className="text-xl mb-1">
            🚨
          </span>

          SOS

        </a>

      </div>

    </div>
  )
}