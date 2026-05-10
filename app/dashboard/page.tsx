 'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Dashboard() {

  // NAVIGATION
  const [activeTab, setActiveTab] = useState('general')

  // PROPERTY
  const [properties, setProperties] = useState<string[]>([])
  const [selectedProperty, setSelectedProperty] = useState('')
  const [newProperty, setNewProperty] = useState('')

  // LOCATION
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [address, setAddress] = useState('')

  // BASIC DATA
  const [wifiName, setWifiName] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [checkin, setCheckin] = useState('')
  const [checkout, setCheckout] = useState('')
  const [checkinNotes, setCheckinNotes] = useState('')
  const [rules, setRules] = useState('')

  // PROPERTY CONTENT
  const [description, setDescription] = useState('')
  const [amenities, setAmenities] = useState('')

  // AI TRAINING
  const [aiKnowledge, setAiKnowledge] = useState('')

  // CONTACTS
  const [contacts, setContacts] = useState<string[]>([])

  // CHECK-IN
  const [lockboxCode, setLockboxCode] = useState('')

  // MODULES
  const [aiEnabled, setAiEnabled] = useState(true)
  const [whatsappEnabled, setWhatsappEnabled] = useState(false)
  const [telegramEnabled, setTelegramEnabled] = useState(false)
  const [welcomebookEnabled, setWelcomebookEnabled] = useState(true)

  // LOAD PROPERTY LIST
  useEffect(() => {
    loadProperties()
  }, [])

  // LOAD PROPERTY DATA
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

    // LOCATION
    setCity(data.city || '')
    setCountry(data.country || '')
    setAddress(data.address || '')

    // BASIC
    setWifiName(data.wifi_name || '')
    setWifiPassword(data.wifi_password || '')
    setCheckin(data.checkin_time || '')
    setCheckout(data.checkout_time || '')
    setCheckinNotes(data.checkin_instructions || '')
    setRules(data.house_rules || '')

    // PROPERTY CONTENT
    setDescription(data.description || '')
    setAmenities(data.amenities || '')

    // AI
    setAiKnowledge(data.ai_knowledge || '')

    // CHECK-IN
    setLockboxCode(data.lockbox_code || '')

    // MODULES
    setAiEnabled(data.ai_enabled ?? true)
    setWhatsappEnabled(data.whatsapp_enabled || false)
    setTelegramEnabled(data.telegram_enabled || false)
    setWelcomebookEnabled(data.welcomebook_enabled ?? true)

    // CONTACTS
    setContacts(data.contacts || [])
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

      // LOCATION
      city,
      country,
      address,

      // BASIC
      wifi_name: wifiName,
      wifi_password: wifiPassword,
      checkin_time: checkin,
      checkout_time: checkout,
      checkin_instructions: checkinNotes,
      house_rules: rules,

      // PROPERTY CONTENT
      description,
      amenities,

      // AI
      ai_knowledge: aiKnowledge,

      // CONTACTS
      contacts,

      // CHECK-IN
      lockbox_code: lockboxCode,

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
              onClick={() => setActiveTab('checkin')}
              className={`w-full text-left px-5 py-4 rounded-2xl transition ${
                activeTab === 'checkin'
                  ? 'bg-black text-white shadow-xl'
                  : 'bg-white border border-gray-200'
              }`}
            >
              🔑 Check-in
            </button>

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

                {/* PROPERTY CONTENT */}

                <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">

                  <h2 className="text-2xl font-bold mb-2">
                    🏡 Property Content
                  </h2>

                  <p className="text-gray-500 mb-6">
                    Basic listing content shown to guests.
                  </p>

                  <div className="space-y-5">

                    <textarea
                      className="w-full border border-gray-200 rounded-2xl p-4 min-h-[180px]"
                      placeholder="Property description (you can paste it from your listing)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />

                    <textarea
                      className="w-full border border-gray-200 rounded-2xl p-4 min-h-[180px]"
                      placeholder="Amenities (you can paste them from your listing)"
                      value={amenities}
                      onChange={(e) => setAmenities(e.target.value)}
                    />

                  </div>

                </section>

                {/* AI TRAINING */}

                <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">

                  <h2 className="text-2xl font-bold mb-2">
                    🤖 AI Training
                  </h2>

                  <p className="text-gray-500 mb-6 leading-relaxed">
                    Everything written here will be used to train the AI concierge
                    so it can answer guest questions more accurately during the stay.
                  </p>

                  <textarea
                    className="w-full border border-gray-200 rounded-2xl p-4 min-h-[320px]"
                    placeholder="Paste here FAQs, parking info, house manual, AC instructions, transport information, recommendations, troubleshooting steps, emergency details, local tips and anything useful for the AI concierge."
                    value={aiKnowledge}
                    onChange={(e) => setAiKnowledge(e.target.value)}
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

            {/* CHECK-IN */}

            {activeTab === 'checkin' && (
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