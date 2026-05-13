 'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const emptyKnowledgeBase = {
  welcome_book: {
    description: '',
    amenities: '',
    house_rules: '',
    parking: '',
    trash: '',
    ac: '',
    boiler: '',
    restaurants: '',
    transport: '',
    local_guide: '',
    emergency: '',
    checkout_notes: '',
    extra_notes: ''
  },

  ai_training: {
    faq: '',
    troubleshooting: '',
    guest_style: '',
    hidden_notes: '',
    additional_notes: ''
  }
}

export default function Dashboard() {

  // NAVIGATION

  const [activeTab, setActiveTab] = useState('general')

  // PROPERTY

  const [properties, setProperties] = useState<string[]>([])
  const [selectedProperty, setSelectedProperty] = useState('')
  const [newProperty, setNewProperty] = useState('')

  // GENERAL

  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [address, setAddress] = useState('')

  const [wifiName, setWifiName] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')

  const [checkin, setCheckin] = useState('')
  const [checkout, setCheckout] = useState('')
  const [checkinNotes, setCheckinNotes] = useState('')
  const [lockboxCode, setLockboxCode] = useState('')

  const [contacts, setContacts] = useState<string[]>([])

  const [emergencyNumbers, setEmergencyNumbers] = useState('')

  // KNOWLEDGE BASE

  const [knowledgeBase, setKnowledgeBase] = useState(emptyKnowledgeBase)

  // MODULES

  const [aiEnabled, setAiEnabled] = useState(true)
  const [whatsappEnabled, setWhatsappEnabled] = useState(false)
  const [telegramEnabled, setTelegramEnabled] = useState(false)
  const [welcomebookEnabled, setWelcomebookEnabled] = useState(true)

  // LOAD PROPERTIES

  useEffect(() => {
    loadProperties()
  }, [])

  useEffect(() => {
    loadPropertyData(selectedProperty)
  }, [selectedProperty])

  const loadProperties = async () => {

    const { data, error } = await supabase
      .from('properties')
      .select('property_name')

    if (error) {
      console.error(error)
      return
    }

    const names = [...new Set(data.map((p: any) => p.property_name))]
    setProperties(names)
  }

  const loadPropertyData = async (propertyName: string) => {

    if (!propertyName) return

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('property_name', propertyName)
      .single()

    if (error) {
      console.error(error)
      return
    }

    // GENERAL

    setCity(data.city || '')
    setCountry(data.country || '')
    setAddress(data.address || '')

    setWifiName(data.wifi_name || '')
    setWifiPassword(data.wifi_password || '')

    setCheckin(data.checkin_time || '')
    setCheckout(data.checkout_time || '')
    setCheckinNotes(data.checkin_instructions || '')

    setLockboxCode(data.lockbox_code || '')

    setContacts(data.contacts || [])

    setEmergencyNumbers(data.emergency_numbers || '')

    // KNOWLEDGE BASE

    const savedKnowledgeBase = data.knowledge_base || {}

    setKnowledgeBase({
      welcome_book: {
        ...emptyKnowledgeBase.welcome_book,
        ...(savedKnowledgeBase.welcome_book || {})
      },

      ai_training: {
        ...emptyKnowledgeBase.ai_training,
        ...(savedKnowledgeBase.ai_training || {})
      }
    })

    // MODULES

    setAiEnabled(data.ai_enabled ?? true)
    setWhatsappEnabled(data.whatsapp_enabled || false)
    setTelegramEnabled(data.telegram_enabled || false)
    setWelcomebookEnabled(data.welcomebook_enabled ?? true)
  }

  // ADD PROPERTY

  const addProperty = () => {

    if (!newProperty) return

    setProperties([...properties, newProperty])
    setSelectedProperty(newProperty)
    setNewProperty('')
  }

  // COPY WIFI

  const copyWifi = () => {

    navigator.clipboard.writeText(
      `Network: ${wifiName} | Password: ${wifiPassword}`
    )

    alert('WiFi copied')
  }

  // SAVE

  const save = async () => {

    if (!selectedProperty) {
      alert('Select a property first')
      return
    }

    const payload = {

      property_name: selectedProperty,

      // GENERAL

      city,
      country,
      address,

      wifi_name: wifiName,
      wifi_password: wifiPassword,

      checkin_time: checkin,
      checkout_time: checkout,
      checkin_instructions: checkinNotes,

      lockbox_code: lockboxCode,

      contacts,

      emergency_numbers: emergencyNumbers,

      // KNOWLEDGE BASE

      knowledge_base: knowledgeBase,

      // MODULES

      ai_enabled: aiEnabled,
      whatsapp_enabled: whatsappEnabled,
      telegram_enabled: telegramEnabled,
      welcomebook_enabled: welcomebookEnabled,
    }

    const { data: existing } = await supabase
      .from('properties')
      .select('id')
      .eq('property_name', selectedProperty)
      .maybeSingle()

    let error = null

    if (existing) {

      const response = await supabase
        .from('properties')
        .update(payload)
        .eq('property_name', selectedProperty)

      error = response.error

    } else {

      const response = await supabase
        .from('properties')
        .insert([payload])

      error = response.error
    }

    if (error) {

      console.error(error)
      alert('Error saving property')

    } else {

      alert('Property saved successfully')
      loadProperties()
    }
  }

  // DELETE PROPERTY

  const deleteProperty = async () => {

    if (!selectedProperty) return

    const confirmDelete = confirm(
      `Delete ${selectedProperty}?`
    )

    if (!confirmDelete) return

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('property_name', selectedProperty)

    if (error) {

      console.error(error)
      alert('Error deleting property')
      return
    }

    alert('Property deleted')

    setSelectedProperty('')
    loadProperties()
  }

  return (

    <div className="min-h-screen bg-[#f5f5f5]">

      {/* HERO */}

      <div className="bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white px-6 py-10 shadow-2xl">

        <div className="max-w-7xl mx-auto">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            <div>

              <div className="uppercase tracking-[0.3em] text-xs text-white/50 mb-4">
                AI CO-HOST PLATFORM
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Property Dashboard
              </h1>

              <p className="text-white/70 text-lg max-w-2xl leading-relaxed">
                Manage welcome pages, AI concierge, check-in instructions,
                local recommendations and guest experience from one place.
              </p>

            </div>

            <div className="grid grid-cols-2 gap-4 min-w-[280px]">

              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/10">

                <div className="text-white/50 text-sm mb-2">
                  Properties
                </div>

                <div className="text-3xl font-bold">
                  {properties.length}
                </div>

              </div>

              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/10">

                <div className="text-white/50 text-sm mb-2">
                  AI Concierge
                </div>

                <div className="text-3xl font-bold">
                  {aiEnabled ? 'ON' : 'OFF'}
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* MAIN */}

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">

        <div className="grid lg:grid-cols-[280px_1fr] gap-8">

          {/* SIDEBAR */}

          <aside className="space-y-3">

            <button
              onClick={() => setActiveTab('general')}
              className={`w-full text-left px-5 py-4 rounded-2xl transition ${
                activeTab === 'general'
                  ? 'bg-black text-white shadow-xl'
                  : 'bg-white border border-gray-200'
              }`}
            >
              🏡 General
            </button>

            <button
              onClick={() => setActiveTab('welcomebook')}
              className={`w-full text-left px-5 py-4 rounded-2xl transition ${
                activeTab === 'welcomebook'
                  ? 'bg-black text-white shadow-xl'
                  : 'bg-white border border-gray-200'
              }`}
            >
              📘 Welcome Book
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`w-full text-left px-5 py-4 rounded-2xl transition ${
                activeTab === 'ai'
                  ? 'bg-black text-white shadow-xl'
                  : 'bg-white border border-gray-200'
              }`}
            >
              🤖 AI Training
            </button>

            <a
              href="/dashboard/cleaning"
              className="w-full block text-left px-5 py-4 rounded-2xl transition bg-white border border-gray-200 hover:bg-black hover:text-white"
            >
              🧹 Cleaning
            </a>

            <a
              href="/dashboard/billing"
              className="w-full block text-left px-5 py-4 rounded-2xl transition bg-white border border-gray-200 hover:bg-black hover:text-white"
            >
              💳 Billing
            </a>
            
          </aside>

          {/* CONTENT */}

          <div className="space-y-8">

            {/* GENERAL */}

            {activeTab === 'general' && (
              <>

                {/* PROPERTY */}

                <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">

                  <h2 className="text-2xl font-bold mb-6">
                    🏡 Property
                  </h2>

                  <div className="grid md:grid-cols-[1fr_auto] gap-4 mb-4">

                    <select
                      className="w-full border border-gray-200 rounded-2xl p-4 bg-white"
                      value={selectedProperty}
                      onChange={(e) => setSelectedProperty(e.target.value)}
                    >

                      <option value="">
                        Select property
                      </option>

                      {properties.map((p, i) => (
                        <option key={i}>
                          {p}
                        </option>
                      ))}

                    </select>

                    <button
                      onClick={deleteProperty}
                      className="bg-red-500 hover:bg-red-600 text-white px-6 rounded-2xl transition"
                    >
                      Delete
                    </button>

                  </div>

                  <div className="flex gap-3">

                    <input
                      className="flex-1 border border-gray-200 rounded-2xl p-4"
                      placeholder="Add new property"
                      value={newProperty}
                      onChange={(e) => setNewProperty(e.target.value)}
                    />

                    <button
                      className="bg-black text-white px-6 rounded-2xl"
                      onClick={addProperty}
                    >
                      + Add Property
                    </button>

                  </div>

                </section>

                {/* LOCATION */}

                <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">

                  <h2 className="text-2xl font-bold mb-6">
                    📍 Location
                  </h2>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">

                    <input
                      className="border border-gray-200 rounded-2xl p-4"
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />

                    <input
                      className="border border-gray-200 rounded-2xl p-4"
                      placeholder="Country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />

                  </div>

                  <input
                    className="w-full border border-gray-200 rounded-2xl p-4"
                    placeholder="Full address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />

                </section>

                {/* WIFI */}

                <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">

                  <div className="flex items-center justify-between mb-6">

                    <h2 className="text-2xl font-bold">
                      📶 WiFi
                    </h2>

                    <button
                      onClick={copyWifi}
                      className="bg-black text-white px-5 py-3 rounded-2xl"
                    >
                      Copy WiFi
                    </button>

                  </div>

                  <div className="grid md:grid-cols-2 gap-4">

                    <input
                      className="border border-gray-200 rounded-2xl p-4"
                      placeholder="WiFi name"
                      value={wifiName}
                      onChange={(e) => setWifiName(e.target.value)}
                    />

                    <input
                      className="border border-gray-200 rounded-2xl p-4"
                      placeholder="WiFi password"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                    />

                  </div>

                </section>

                {/* CHECK-IN */}

                <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">

                  <h2 className="text-2xl font-bold mb-6">
                    🔑 Check-in
                  </h2>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">

                    <input
                      className="border border-gray-200 rounded-2xl p-4"
                      placeholder="Check-in time"
                      value={checkin}
                      onChange={(e) => setCheckin(e.target.value)}
                    />

                    <input
                      className="border border-gray-200 rounded-2xl p-4"
                      placeholder="Check-out time"
                      value={checkout}
                      onChange={(e) => setCheckout(e.target.value)}
                    />

                  </div>

                  <textarea
                    className="w-full border border-gray-200 rounded-2xl p-4 min-h-[180px] mb-4"
                    placeholder="Check-in instructions"
                    value={checkinNotes}
                    onChange={(e) => setCheckinNotes(e.target.value)}
                  />

                  <input
                    className="w-full border border-gray-200 rounded-2xl p-4"
                    placeholder="Lockbox code"
                    value={lockboxCode}
                    onChange={(e) => setLockboxCode(e.target.value)}
                  />

                </section>

                {/* CONTACTS */}

                <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">

                  <div className="flex items-center justify-between mb-6">

                    <h2 className="text-2xl font-bold">
                      📞 Contacts
                    </h2>

                    <button
                      onClick={() => setContacts([...contacts, ''])}
                      className="bg-black text-white px-5 py-3 rounded-2xl"
                    >
                      + Add Contact
                    </button>

                  </div>

                  <div className="space-y-4">

                    {contacts.map((contact, i) => (

                      <input
                        key={i}
                        className="w-full border border-gray-200 rounded-2xl p-4"
                        placeholder="Host / Cleaning / Security / Maintenance..."
                        value={contact}
                        onChange={(e) => {
                          const copy = [...contacts]
                          copy[i] = e.target.value
                          setContacts(copy)
                        }}
                      />

                    ))}

                  </div>

                </section>

                {/* EMERGENCY */}

                <section className="bg-white rounded-[32px] p-7 shadow-xl border border-red-100">

                  <h2 className="text-2xl font-bold mb-6">
                    🚨 Emergency Numbers
                  </h2>

                  <textarea
                    className="w-full border border-gray-200 rounded-2xl p-4 min-h-[180px]"
                    placeholder="Emergency contacts, hospitals, police, maintenance..."
                    value={emergencyNumbers}
                    onChange={(e) => setEmergencyNumbers(e.target.value)}
                  />

                </section>

                {/* MODULES */}

                <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">

                  <h2 className="text-2xl font-bold mb-6">
                    ⚙️ Modules
                  </h2>

                  <div className="grid md:grid-cols-2 gap-4">

                    <label className="flex items-center justify-between bg-gray-50 rounded-2xl p-5">
                      <span>AI Concierge</span>

                      <input
                        type="checkbox"
                        checked={aiEnabled}
                        onChange={(e) => setAiEnabled(e.target.checked)}
                      />
                    </label>

                    <label className="flex items-center justify-between bg-gray-50 rounded-2xl p-5">
                      <span>WhatsApp Integration</span>

                      <input
                        type="checkbox"
                        checked={whatsappEnabled}
                        onChange={(e) => setWhatsappEnabled(e.target.checked)}
                      />
                    </label>

                    <label className="flex items-center justify-between bg-gray-50 rounded-2xl p-5">
                      <span>Telegram Integration</span>

                      <input
                        type="checkbox"
                        checked={telegramEnabled}
                        onChange={(e) => setTelegramEnabled(e.target.checked)}
                      />
                    </label>

                    <label className="flex items-center justify-between bg-gray-50 rounded-2xl p-5">
                      <span>Welcome Book</span>

                      <input
                        type="checkbox"
                        checked={welcomebookEnabled}
                        onChange={(e) => setWelcomebookEnabled(e.target.checked)}
                      />
                    </label>

                  </div>

                </section>

              </>
            )}

            {/* WELCOME BOOK */}

            {activeTab === 'welcomebook' && (
              <>

                <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">

                  <h2 className="text-2xl font-bold mb-2">
                    📘 Welcome Book
                  </h2>

                  <p className="text-gray-500 mb-6">
                    Information visible to guests during the stay.
                  </p>

                  <div className="space-y-5">

                    <textarea
                      className="w-full border border-gray-200 rounded-2xl p-4 min-h-[180px]"
                      placeholder="Property description"
                      value={knowledgeBase.welcome_book.description}
                      onChange={(e) =>
                        setKnowledgeBase({
                          ...knowledgeBase,
                          welcome_book: {
                            ...knowledgeBase.welcome_book,
                            description: e.target.value
                          }
                        })
                      }
                    />

                    <textarea
                      className="w-full border border-gray-200 rounded-2xl p-4 min-h-[180px]"
                      placeholder="Amenities"
                      value={knowledgeBase.welcome_book.amenities}
                      onChange={(e) =>
                        setKnowledgeBase({
                          ...knowledgeBase,
                          welcome_book: {
                            ...knowledgeBase.welcome_book,
                            amenities: e.target.value
                          }
                        })
                      }
                    />

                    <textarea
                      className="w-full border border-gray-200 rounded-2xl p-4 min-h-[140px]"
                      placeholder="House rules"
                      value={knowledgeBase.welcome_book.house_rules}
                      onChange={(e) =>
                        setKnowledgeBase({
                          ...knowledgeBase,
                          welcome_book: {
                            ...knowledgeBase.welcome_book,
                            house_rules: e.target.value
                          }
                        })
                      }
                    />

                    <textarea
                      className="w-full border border-gray-200 rounded-2xl p-4 min-h-[140px]"
                      placeholder="Parking information"
                      value={knowledgeBase.welcome_book.parking}
                      onChange={(e) =>
                        setKnowledgeBase({
                          ...knowledgeBase,
                          welcome_book: {
                            ...knowledgeBase.welcome_book,
                            parking: e.target.value
                          }
                        })
                      }
                    />

                    <textarea
                      className="w-full border border-gray-200 rounded-2xl p-4 min-h-[140px]"
                      placeholder="Trash and recycling instructions"
                      value={knowledgeBase.welcome_book.trash}
                      onChange={(e) =>
                        setKnowledgeBase({
                          ...knowledgeBase,
                          welcome_book: {
                            ...knowledgeBase.welcome_book,
                            trash: e.target.value
                          }
                        })
                      }
                    />

                    <textarea
                      className="w-full border border-gray-200 rounded-2xl p-4 min-h-[140px]"
                      placeholder="Air conditioning instructions"
                      value={knowledgeBase.welcome_book.ac}
                      onChange={(e) =>
                        setKnowledgeBase({
                          ...knowledgeBase,
                          welcome_book: {
                            ...knowledgeBase.welcome_book,
                            ac: e.target.value
                          }
                        })
                      }
                    />

                    <textarea
                      className="w-full border border-gray-200 rounded-2xl p-4 min-h-[140px]"
                      placeholder="Boiler / hot water instructions"
                      value={knowledgeBase.welcome_book.boiler}
                      onChange={(e) =>
                        setKnowledgeBase({
                          ...knowledgeBase,
                          welcome_book: {
                            ...knowledgeBase.welcome_book,
                            boiler: e.target.value
                          }
                        })
                      }
                    />

                    <textarea
                      className="w-full border border-gray-200 rounded-2xl p-4 min-h-[160px]"
                      placeholder="Restaurants and food recommendations"
                      value={knowledgeBase.welcome_book.restaurants}
                      onChange={(e) =>
                        setKnowledgeBase({
                          ...knowledgeBase,
                          welcome_book: {
                            ...knowledgeBase.welcome_book,
                            restaurants: e.target.value
                          }
                        })
                      }
                    />

                    <textarea
                      className="w-full border border-gray-200 rounded-2xl p-4 min-h-[140px]"
                      placeholder="Transport information"
                      value={knowledgeBase.welcome_book.transport}
                      onChange={(e) =>
                        setKnowledgeBase({
                          ...knowledgeBase,
                          welcome_book: {
                            ...knowledgeBase.welcome_book,
                            transport: e.target.value
                          }
                        })
                      }
                    />

                    <textarea
                      className="w-full border border-gray-200 rounded-2xl p-4 min-h-[180px]"
                      placeholder="Local guide"
                      value={knowledgeBase.welcome_book.local_guide}
                      onChange={(e) =>
                        setKnowledgeBase({
                          ...knowledgeBase,
                          welcome_book: {
                            ...knowledgeBase.welcome_book,
                            local_guide: e.target.value
                          }
                        })
                      }
                    />

                    <textarea
                      className="w-full border border-gray-200 rounded-2xl p-4 min-h-[140px]"
                      placeholder="Emergency information visible to guests"
                      value={knowledgeBase.welcome_book.emergency}
                      onChange={(e) =>
                        setKnowledgeBase({
                          ...knowledgeBase,
                          welcome_book: {
                            ...knowledgeBase.welcome_book,
                            emergency: e.target.value
                          }
                        })
                      }
                    />

                    <textarea
                      className="w-full border border-gray-200 rounded-2xl p-4 min-h-[140px]"
                      placeholder="Checkout notes"
                      value={knowledgeBase.welcome_book.checkout_notes}
                      onChange={(e) =>
                        setKnowledgeBase({
                          ...knowledgeBase,
                          welcome_book: {
                            ...knowledgeBase.welcome_book,
                            checkout_notes: e.target.value
                          }
                        })
                      }
                    />

                    <textarea
                      className="w-full border border-gray-200 rounded-2xl p-4 min-h-[220px]"
                      placeholder="Extra notes for this property"
                      value={knowledgeBase.welcome_book.extra_notes}
                      onChange={(e) =>
                        setKnowledgeBase({
                          ...knowledgeBase,
                          welcome_book: {
                            ...knowledgeBase.welcome_book,
                            extra_notes: e.target.value
                          }
                        })
                      }
                    />

                  </div>

                </section>

              </>
            )}

            {/* AI TRAINING */}

            {activeTab === 'ai' && (
              <>

                <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">

                  <h2 className="text-2xl font-bold mb-2">
                    🤖 AI Training
                  </h2>

                  <p className="text-gray-500 mb-6 leading-relaxed">
                    Internal AI knowledge used by the AI concierge.
                  </p>

                  <div className="space-y-5">

                    <textarea
                      className="w-full border border-gray-200 rounded-2xl p-4 min-h-[160px]"
                      placeholder="FAQs"
                      value={knowledgeBase.ai_training.faq}
                      onChange={(e) =>
                        setKnowledgeBase({
                          ...knowledgeBase,
                          ai_training: {
                            ...knowledgeBase.ai_training,
                            faq: e.target.value
                          }
                        })
                      }
                    />

                    <textarea
                      className="w-full border border-gray-200 rounded-2xl p-4 min-h-[180px]"
                      placeholder="Troubleshooting & operational notes"
                      value={knowledgeBase.ai_training.troubleshooting}
                      onChange={(e) =>
                        setKnowledgeBase({
                          ...knowledgeBase,
                          ai_training: {
                            ...knowledgeBase.ai_training,
                            troubleshooting: e.target.value
                          }
                        })
                      }
                    />

                    <textarea
                      className="w-full border border-gray-200 rounded-2xl p-4 min-h-[140px]"
                      placeholder="Guest communication style"
                      value={knowledgeBase.ai_training.guest_style}
                      onChange={(e) =>
                        setKnowledgeBase({
                          ...knowledgeBase,
                          ai_training: {
                            ...knowledgeBase.ai_training,
                            guest_style: e.target.value
                          }
                        })
                      }
                    />

                    <textarea
                      className="w-full border border-gray-200 rounded-2xl p-4 min-h-[180px]"
                      placeholder="Hidden operational notes"
                      value={knowledgeBase.ai_training.hidden_notes}
                      onChange={(e) =>
                        setKnowledgeBase({
                          ...knowledgeBase,
                          ai_training: {
                            ...knowledgeBase.ai_training,
                            hidden_notes: e.target.value
                          }
                        })
                      }
                    />

                    <textarea
                      className="w-full border border-gray-200 rounded-2xl p-4 min-h-[220px]"
                      placeholder="Additional AI notes"
                      value={knowledgeBase.ai_training.additional_notes}
                      onChange={(e) =>
                        setKnowledgeBase({
                          ...knowledgeBase,
                          ai_training: {
                            ...knowledgeBase.ai_training,
                            additional_notes: e.target.value
                          }
                        })
                      }
                    />

                  </div>

                </section>

              </>
            )}

          </div>

        </div>

      </div>

      {/* SAVE BAR */}

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl bg-black text-white rounded-3xl px-6 py-5 shadow-2xl flex items-center justify-between z-50">

        <div>

          <div className="font-semibold">
            {selectedProperty || 'No property selected'}
          </div>

          <div className="text-white/60 text-sm">
            Changes are ready to be saved
          </div>

        </div>

        <button
          onClick={save}
          className="bg-white text-black px-6 py-3 rounded-2xl font-semibold hover:opacity-90 transition"
        >
          Save Changes
        </button>

      </div>

    </div>
  )
}