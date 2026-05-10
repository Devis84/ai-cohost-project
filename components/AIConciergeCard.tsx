 type Props = {
  hostPhone?: string
}

const suggestions = [
  '🍕 Best pizza nearby',
  '☕ Best breakfast spots',
  '🚕 Airport transfer',
  '🛒 Closest supermarket',
  '🔑 Late check-out',
  '📶 WiFi help',
]

export default function AIConciergeCard({
  hostPhone,
}: Props) {

  return (

    <section className="mb-10">

      <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-black via-gray-900 to-gray-800 shadow-2xl border border-white/5">

        {/* BACKGROUND GLOW */}

        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />

        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />

        {/* CONTENT */}

        <div className="relative z-10 p-8 md:p-10">

          {/* HEADER */}

          <div className="flex items-start justify-between gap-6 mb-8">

            <div>

              <div className="uppercase tracking-[0.25em] text-[11px] font-semibold text-white/40 mb-3">

                AI CONCIERGE

              </div>

              <h2 className="text-4xl font-bold text-white leading-tight mb-4 max-w-xl">

                Your personal digital stay assistant

              </h2>

              <p className="text-white/65 leading-relaxed max-w-2xl text-lg">

                Ask anything about your stay, nearby places, transportation,
                WiFi, check-in, local recommendations or instant host support.

              </p>

            </div>

            <div className="hidden md:flex items-center justify-center w-20 h-20 rounded-[28px] bg-white/10 backdrop-blur-xl border border-white/10 text-5xl shadow-2xl">

              🤖

            </div>

          </div>

          {/* CHAT PREVIEW */}

          <div className="space-y-5 mb-8">

            {/* USER */}

            <div className="flex justify-end">

              <div className="max-w-[85%] bg-white text-black px-5 py-4 rounded-[24px] rounded-br-md shadow-2xl">

                <div className="text-sm font-medium">

                  What’s the best pizza nearby?

                </div>

              </div>

            </div>

            {/* AI */}

            <div className="flex justify-start">

              <div className="max-w-[90%] bg-white/10 backdrop-blur-xl border border-white/10 px-5 py-4 rounded-[24px] rounded-bl-md shadow-2xl">

                <div className="text-white/90 leading-relaxed text-sm">

                  🍕 I recommend <strong>Pizzeria Roma Centro</strong> —
                  authentic Roman-style pizza, 6 minutes walking distance
                  and highly rated by guests.

                </div>

              </div>

            </div>

          </div>

          {/* SMART CHIPS */}

          <div className="flex flex-wrap gap-3 mb-8">

            {suggestions.map((item) => (

              <button
                key={item}
                className="bg-white/10 hover:bg-white/15 border border-white/10 backdrop-blur-xl px-5 py-3 rounded-full text-sm text-white/85 transition-all duration-300 hover:scale-[1.02]"
              >

                {item}

              </button>

            ))}

          </div>

          {/* CTA */}

          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">

            <a
              href={`https://wa.me/${hostPhone || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-white text-black font-semibold px-7 py-4 rounded-2xl shadow-2xl hover:opacity-90 transition-all duration-300"
            >

              <span className="text-xl">
                💬
              </span>

              Open AI Concierge

            </a>

            <div className="flex items-center gap-3 text-white/50 text-sm">

              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />

              Average response time under 1 minute

            </div>

          </div>

        </div>

      </div>

    </section>
  )
}