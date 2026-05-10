 import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-10">

        <div className="bg-white p-8 rounded-3xl shadow-xl text-center">

          <h1 className="text-3xl font-bold mb-4">
            Property not found
          </h1>

          <p className="text-gray-500">
            The requested welcome page does not exist.
          </p>

        </div>

      </div>
    )
  }

  return (

    <div className="min-h-screen bg-[#f3f4f6]">

      {/* HERO */}

      <div className="relative h-[460px] w-full overflow-hidden">

        <img
          src={
            propertyData.image_url ||
            'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85'
          }
          alt={propertyData.property_name}
          className="h-full w-full object-cover"
        />

        {/* OVERLAY */}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* HERO CONTENT */}

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">

          <div className="flex flex-wrap gap-2 mb-5">

            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm">
              ⭐ Guest Favorite
            </div>

            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm">
              📶 Fast WiFi
            </div>

            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm">
              🤖 AI Concierge
            </div>

          </div>

          <h1 className="text-5xl font-bold leading-tight mb-3">
            {propertyData.property_name}
          </h1>

          <p className="text-white/80 text-lg">
            {propertyData.city || 'Unknown city'},
            {' '}
            {propertyData.country || 'Unknown country'}
          </p>

          <p className="text-white/70 text-sm mt-2">
            {propertyData.address || ''}
          </p>

        </div>

      </div>

      {/* MAIN CONTENT */}

      <div className="max-w-3xl mx-auto px-4 -mt-12 relative z-10 pb-40">

        {/* QUICK ACTIONS */}

        <section className="mb-8">

          <div className="grid grid-cols-2 gap-4">

            {/* MAPS */}

            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(
                propertyData.address || ''
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-3xl p-6 shadow-xl hover:scale-[1.02] transition-all duration-300"
            >

              <div className="text-4xl mb-4">
                📍
              </div>

              <div className="font-semibold text-lg">
                Open Maps
              </div>

              <div className="text-sm text-gray-500 mt-1">
                Navigate to property
              </div>

            </a>

            {/* WHATSAPP */}

            <a
              href={`https://wa.me/${propertyData.host_phone || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-3xl p-6 shadow-xl hover:scale-[1.02] transition-all duration-300"
            >

              <div className="text-4xl mb-4">
                💬
              </div>

              <div className="font-semibold text-lg">
                Contact Host
              </div>

              <div className="text-sm text-gray-500 mt-1">
                AI + WhatsApp support
              </div>

            </a>

          </div>

        </section>

        {/* AI CONCIERGE */}

        <section className="mb-8">

          <div className="bg-gradient-to-r from-black to-gray-800 text-white rounded-3xl p-7 shadow-2xl">

            <div className="flex items-start justify-between gap-4">

              <div>

                <div className="text-sm uppercase tracking-widest text-white/60 mb-2">
                  AI Concierge
                </div>

                <h2 className="text-3xl font-bold mb-3">
                  Need anything during your stay?
                </h2>

                <p className="text-white/70 leading-relaxed">
                  Ask questions, get local recommendations, receive check-in help,
                  or contact the host instantly through WhatsApp.
                </p>

              </div>

              <div className="text-5xl">
                🤖
              </div>

            </div>

          </div>

        </section>

        {/* WIFI */}

        <section className="mb-6">

          <div className="bg-white rounded-3xl p-7 shadow-xl">

            <div className="flex items-center justify-between mb-6">

              <h2 className="text-2xl font-semibold">
                📶 WiFi
              </h2>

              <div className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                High Speed
              </div>

            </div>

            <div className="space-y-4 text-gray-700">

              <div>
                <span className="font-semibold">
                  Network:
                </span>{' '}
                {propertyData.wifi_name || 'N/A'}
              </div>

              <div>
                <span className="font-semibold">
                  Password:
                </span>{' '}
                {propertyData.wifi_password || 'N/A'}
              </div>

            </div>

          </div>

        </section>

        {/* CHECK-IN */}

        <section className="mb-6">

          <div className="bg-white rounded-3xl p-7 shadow-xl">

            <h2 className="text-2xl font-semibold mb-6">
              🔑 Check-in
            </h2>

            <div className="space-y-5 text-gray-700">

              <p>
                <strong>Check-in:</strong>{' '}
                {propertyData.checkin_time || 'N/A'}
              </p>

              <p>
                <strong>Check-out:</strong>{' '}
                {propertyData.checkout_time || 'N/A'}
              </p>

              <p className="whitespace-pre-line">
                <strong>Instructions:</strong>
                <br />
                {propertyData.checkin_instructions || 'N/A'}
              </p>

              <p>
                <strong>Lockbox:</strong>{' '}
                {propertyData.lockbox_code || 'N/A'}
              </p>

            </div>

          </div>

        </section>

        {/* HOUSE RULES */}

        <section className="mb-6">

          <div className="bg-white rounded-3xl p-7 shadow-xl">

            <h2 className="text-2xl font-semibold mb-6">
              📜 House Rules
            </h2>

            <div className="whitespace-pre-line text-gray-700 leading-relaxed">

              {propertyData.house_rules || 'No rules provided.'}

            </div>

          </div>

        </section>

        {/* LOCAL INFO */}

        <section className="mb-6">

          <div className="bg-white rounded-3xl p-7 shadow-xl">

            <h2 className="text-2xl font-semibold mb-6">
              📍 Local Information
            </h2>

            <div className="whitespace-pre-line text-gray-700 leading-relaxed">

              {propertyData.local_info || 'No local information provided.'}

            </div>

          </div>

        </section>

        {/* EMERGENCY */}

        <section className="mb-6">

          <div className="bg-red-50 border border-red-200 rounded-3xl p-7 shadow-xl">

            <h2 className="text-2xl font-semibold mb-6">
              🚨 Emergency
            </h2>

            <div className="whitespace-pre-line text-gray-700 leading-relaxed">

              {propertyData.emergency_info || 'No emergency information provided.'}

            </div>

          </div>

        </section>

        {/* ABOUT */}

        <section className="mb-6">

          <div className="bg-white rounded-3xl p-7 shadow-xl">

            <h2 className="text-2xl font-semibold mb-6">
              🏡 About This Property
            </h2>

            <div className="whitespace-pre-line text-gray-700 leading-relaxed">

              {propertyData.description || 'No description available.'}

            </div>

          </div>

        </section>

        {/* AMENITIES */}

        <section className="mb-10">

          <div className="bg-white rounded-3xl p-7 shadow-xl">

            <h2 className="text-2xl font-semibold mb-6">
              ✨ Amenities
            </h2>

            <div className="whitespace-pre-line text-gray-700 leading-relaxed">

              {propertyData.amenities || 'No amenities listed.'}

            </div>

          </div>

        </section>

        {/* NEED HELP */}

        <section>

          <div className="bg-white rounded-3xl p-7 shadow-xl border border-gray-200">

            <h2 className="text-2xl font-semibold mb-4">
              💡 Need Help?
            </h2>

            <p className="text-gray-600 leading-relaxed mb-6">
              Our AI concierge is available 24/7 to help with your stay,
              recommendations, house information, or direct host support.
            </p>

            <a
              href={`https://wa.me/${propertyData.host_phone || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-black text-white px-6 py-4 rounded-2xl hover:opacity-90 transition"
            >

              <span className="text-xl">
                💬
              </span>

              Chat with Concierge

            </a>

          </div>

        </section>

      </div>

      {/* FLOATING BAR */}

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[94%] max-w-lg bg-black/95 backdrop-blur-xl text-white rounded-3xl shadow-2xl px-6 py-4 flex items-center justify-between z-50 border border-white/10">

        <a
          href={`https://wa.me/${propertyData.host_phone || ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center text-xs"
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
          className="flex flex-col items-center text-xs"
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
          className="flex flex-col items-center text-xs"
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