type Props = {
  address?: string
  hostPhone?: string
}

export default function QuickActions({
  address,
  hostPhone,
}: Props) {

  return (

    <section className="mb-10">

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {/* MAPS */}

        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(
            address || ''
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group bg-white rounded-[28px] p-5 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-100"
        >

          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition">

            📍

          </div>

          <div className="font-semibold text-gray-900 text-lg mb-1">
            Maps
          </div>

          <div className="text-sm text-gray-500 leading-relaxed">
            Navigate directly to the property
          </div>

        </a>

        {/* WHATSAPP */}

        <a
          href={`https://wa.me/${hostPhone || ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group bg-white rounded-[28px] p-5 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-100"
        >

          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition">

            💬

          </div>

          <div className="font-semibold text-gray-900 text-lg mb-1">
            Host Chat
          </div>

          <div className="text-sm text-gray-500 leading-relaxed">
            AI concierge and WhatsApp support
          </div>

        </a>

        {/* WIFI */}

        <div
          className="group bg-white rounded-[28px] p-5 shadow-xl border border-gray-100"
        >

          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl mb-4">

            📶

          </div>

          <div className="font-semibold text-gray-900 text-lg mb-1">
            Fast WiFi
          </div>

          <div className="text-sm text-gray-500 leading-relaxed">
            High-speed connection available
          </div>

        </div>

        {/* CHECK-IN */}

        <div
          className="group bg-white rounded-[28px] p-5 shadow-xl border border-gray-100"
        >

          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl mb-4">

            🔑

          </div>

          <div className="font-semibold text-gray-900 text-lg mb-1">
            Self Check-in
          </div>

          <div className="text-sm text-gray-500 leading-relaxed">
            Easy and secure access anytime
          </div>

        </div>

      </div>

    </section>
  )
}