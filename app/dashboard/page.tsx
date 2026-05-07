'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Dashboard() {

  // LOGIN
  const [loginEnabled, setLoginEnabled] = useState(false)

  // PROPERTY
  const [properties, setProperties] = useState<string[]>([])
  const [selectedProperty, setSelectedProperty] = useState('')
  const [newProperty, setNewProperty] = useState('')

  // DATA
  const [wifiName, setWifiName] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [checkin, setCheckin] = useState('')
  const [checkout, setCheckout] = useState('')
  const [checkinNotes, setCheckinNotes] = useState('')
  const [rules, setRules] = useState('')
  const [description, setDescription] = useState('')
  const [amenities, setAmenities] = useState('')
  const [aiKnowledge, setAiKnowledge] = useState('')
  const [contacts, setContacts] = useState<string[]>([])

  // LOAD PROPERTIES
  useEffect(() => {
    loadProperties()
  }, [])

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

  // CONTACTS
  const addContact = () => {
    setContacts([...contacts, ''])
  }

  const updateContact = (i: number, val: string) => {
    const copy = [...contacts]
    copy[i] = val
    setContacts(copy)
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
    const { error } = await supabase.from('properties').insert([
      {
        property_name: selectedProperty,
        wifi_name: wifiName,
        wifi_password: wifiPassword,
        checkin_time: checkin,
        checkout_time: checkout,
        checkin_instructions: checkinNotes,
        house_rules: rules,
        description,
        amenities,
        ai_knowledge: aiKnowledge,
      },
    ])

    if (error) {
      console.error(error)
      alert('Error saving')
    } else {
      alert('Saved successfully')
      loadProperties()
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 space-y-8">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            🏡 AI Co-Host Dashboard
          </h1>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Login
            </span>

            <button
              className={`px-4 py-2 rounded-lg text-white ${
                loginEnabled ? 'bg-black' : 'bg-gray-400'
              }`}
              onClick={() => setLoginEnabled(true)}
            >
              ON
            </button>

            <button
              className={`px-4 py-2 rounded-lg text-white ${
                !loginEnabled ? 'bg-black' : 'bg-gray-400'
              }`}
              onClick={() => setLoginEnabled(false)}
            >
              OFF
            </button>
          </div>
        </div>

        {/* PROPERTY */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            🏡 Property
          </h2>

          <select
            className="w-full border rounded-lg p-3"
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

          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-lg p-3"
              placeholder="Add new property"
              value={newProperty}
              onChange={(e) => setNewProperty(e.target.value)}
            />

            <button
              className="bg-black text-white px-4 rounded-lg"
              onClick={addProperty}
            >
              + Add
            </button>
          </div>
        </section>

        {/* WIFI */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            📶 WiFi
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="border rounded-lg p-3"
              placeholder="Network name"
              value={wifiName}
              onChange={(e) => setWifiName(e.target.value)}
            />

            <input
              className="border rounded-lg p-3"
              placeholder="Password"
              value={wifiPassword}
              onChange={(e) => setWifiPassword(e.target.value)}
            />
          </div>

          <button
            className="bg-gray-800 text-white px-4 py-2 rounded-lg"
            onClick={copyWifi}
          >
            Copy WiFi
          </button>
        </section>

        {/* STAY INFO */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            🌴 Stay Info
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="border rounded-lg p-3"
              placeholder="Check-in time"
              value={checkin}
              onChange={(e) => setCheckin(e.target.value)}
            />

            <input
              className="border rounded-lg p-3"
              placeholder="Check-out time"
              value={checkout}
              onChange={(e) => setCheckout(e.target.value)}
            />
          </div>

          <textarea
            className="w-full border rounded-lg p-3 min-h-[120px]"
            placeholder="Additional notes..."
            value={checkinNotes}
            onChange={(e) => setCheckinNotes(e.target.value)}
          />
        </section>

        {/* CONTACTS */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            📞 Contacts
          </h2>

          {contacts.map((c, i) => (
            <input
              key={i}
              className="w-full border rounded-lg p-3"
              placeholder="Contact"
              value={c}
              onChange={(e) => updateContact(i, e.target.value)}
            />
          ))}

          <button
            className="bg-black text-white px-4 py-2 rounded-lg"
            onClick={addContact}
          >
            + Add contact
          </button>
        </section>

        {/* RULES */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            📜 House Rules
          </h2>

          <textarea
            className="w-full border rounded-lg p-3 min-h-[120px]"
            placeholder="Rules..."
            value={rules}
            onChange={(e) => setRules(e.target.value)}
          />
        </section>

        {/* DESCRIPTION */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            ✏️ Description
          </h2>

          <textarea
            className="w-full border rounded-lg p-3 min-h-[160px]"
            placeholder="Paste from Airbnb / Booking listing"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </section>

        {/* AMENITIES */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            ✨ Amenities
          </h2>

          <textarea
            className="w-full border rounded-lg p-3 min-h-[120px]"
            placeholder="Paste amenities from Airbnb"
            value={amenities}
            onChange={(e) => setAmenities(e.target.value)}
          />

          <button className="bg-gray-800 text-white px-4 py-2 rounded-lg">
            Extract amenities
          </button>
        </section>

        {/* AI KNOWLEDGE */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            🧠 AI Knowledge
          </h2>

          <textarea
            className="w-full border rounded-lg p-3 min-h-[220px]"
            placeholder={`Add everything guests might ask:

- How appliances work
- Boiler / AC
- House quirks
- Tips
- Emergency info

This trains your AI assistant.`}
            value={aiKnowledge}
            onChange={(e) => setAiKnowledge(e.target.value)}
          />
        </section>

        {/* SAVE */}
        <button
          className="w-full bg-black text-white py-4 rounded-xl text-lg font-semibold hover:opacity-90 transition"
          onClick={save}
        >
          💾 Save Property
        </button>

      </div>
    </div>
  )
}