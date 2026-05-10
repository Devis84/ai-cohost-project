type Place = {
  name: string
  category: string
  distance: string
  image: string
  mapsUrl: string
}

const places: Place[] = [
  {
    name: 'Pizzeria Roma Centro',
    category: '🍕 Restaurant',
    distance: '6 min walk',
    image:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591',
    mapsUrl: 'https://maps.google.com',
  },
  {
    name: 'Caffè Milano',
    category: '☕ Café',
    distance: '3 min walk',
    image:
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93',
    mapsUrl: 'https://maps.google.com',
  },
  {
    name: 'Carrefour Express',
    category: '🛒 Supermarket',
    distance: '4 min walk',
    image:
      'https://images.unsplash.com/photo-1542838132-92c53300491e',
    mapsUrl: 'https://maps.google.com',
  },
]

export default function NearbyPlaces() {
  return (

    <section className="mb-10">

      <div className="flex items-center justify-between mb-5">

        <div>

          <div className="uppercase tracking-[0.2em] text-xs text-gray-400 mb-2">
            LOCAL GUIDE
          </div>

          <h2 className="text-3xl font-bold text-gray-900">
            Nearby Places
          </h2>

        </div>

        <div className="text-sm text-gray-500">
          Curated for guests
        </div>

      </div>

      <div className="flex gap-5 overflow-x-auto pb-2 no-scrollbar">

        {places.map((place) => (

          <div
            key={place.name}
            className="min-w-[280px] bg-white rounded-[28px] shadow-xl overflow-hidden border border-gray-100"
          >

            <div className="relative h-[180px]">

              <img
                src={place.image}
                alt={place.name}
                className="w-full h-full object-cover"
              />

              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium">
                {place.category}
              </div>

            </div>

            <div className="p-5">

              <div className="flex items-start justify-between gap-3 mb-4">

                <div>

                  <h3 className="font-bold text-lg text-gray-900 mb-1">
                    {place.name}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {place.distance}
                  </p>

                </div>

              </div>

              <a
                href={place.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full bg-black text-white rounded-2xl py-3 text-sm font-medium hover:opacity-90 transition"
              >

                📍 Open in Maps

              </a>

            </div>

          </div>

        ))}

      </div>

    </section>
  )
}