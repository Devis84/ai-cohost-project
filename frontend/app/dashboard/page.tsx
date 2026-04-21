'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Dashboard() {

  // LOGIN
  const [loginEnabled, setLoginEnabled] = useState(false)

  // PROPERTY (multi)
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

  // CONTACTS
  const addContact = () => setContacts([...contacts, ''])
  const updateContact = (i: number, val: string) => {
    const copy = [...contacts]
    copy[i] = val
    setContacts(copy)
  }

  // PROPERTY
  const addProperty = () => {
    if (!newProperty) return
    setProperties([...properties, newProperty])
    setSelectedProperty(newProperty)
    setNewProperty('')
  }

  // WIFI COPY
  const copyWifi = () => {
    navigator.clipboard.writeText(`Network: ${wifiName} | Password: ${wifiPassword}`)
    alert('WiFi copiato')
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
      alert('Errore salvataggio')
    } else {
      alert('Salvato correttamente')
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>

      <h1>Dashboard</h1>

      {/* LOGIN */}
      <div style={{ marginBottom: 20 }}>
        <strong>Login:</strong>
        <button
          style={{ marginLeft: 10, background: loginEnabled ? 'black' : 'lightgray', color: loginEnabled ? 'white' : 'black' }}
          onClick={() => setLoginEnabled(true)}
        >
          ON
        </button>
        <button
          style={{ marginLeft: 5, background: !loginEnabled ? 'black' : 'lightgray', color: !loginEnabled ? 'white' : 'black' }}
          onClick={() => setLoginEnabled(false)}
        >
          OFF
        </button>
      </div>

      {/* PROPERTY */}
      <h3>🏡 Property</h3>

      <select
        value={selectedProperty}
        onChange={(e) => setSelectedProperty(e.target.value)}
      >
        <option value="">Select property</option>
        {properties.map((p, i) => (
          <option key={i}>{p}</option>
        ))}
      </select>

      <br /><br />

      <input
        placeholder="Add new property"
        value={newProperty}
        onChange={(e) => setNewProperty(e.target.value)}
      />
      <button onClick={addProperty}>+ Add property</button>

      {/* WIFI */}
      <h3>📶 WiFi</h3>

      <input
        placeholder="Network name"
        value={wifiName}
        onChange={(e) => setWifiName(e.target.value)}
      />

      <input
        placeholder="Password"
        value={wifiPassword}
        onChange={(e) => setWifiPassword(e.target.value)}
      />

      <br />
      <button onClick={copyWifi}>Copy WiFi</button>

      {/* STAY INFO */}
      <h3>🌴 Stay Info</h3>

      <label>Check-in time</label><br />
      <input
        placeholder="e.g. 15:00"
        value={checkin}
        onChange={(e) => setCheckin(e.target.value)}
      />

      <br />

      <label>Check-out time</label><br />
      <input
        placeholder="e.g. 11:00"
        value={checkout}
        onChange={(e) => setCheckout(e.target.value)}
      />

      <br />

      <textarea
        placeholder="Additional notes (self check-in, instructions...)"
        value={checkinNotes}
        onChange={(e) => setCheckinNotes(e.target.value)}
      />

      {/* CONTACTS */}
      <h3>📞 Contacts</h3>

      {contacts.map((c, i) => (
        <input
          key={i}
          placeholder="Contact (e.g. police, cleaner, owner...)"
          value={c}
          onChange={(e) => updateContact(i, e.target.value)}
        />
      ))}

      <button onClick={addContact}>+ Add contact</button>

      {/* RULES */}
      <h3>📜 House Rules</h3>
      <textarea
        placeholder="Rules..."
        value={rules}
        onChange={(e) => setRules(e.target.value)}
      />

      {/* DESCRIPTION */}
      <h3>✏️ Description</h3>
      <textarea
        placeholder="Paste from Airbnb / Booking listing"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {/* AMENITIES */}
      <h3>✨ Amenities</h3>
      <textarea
        placeholder="Paste amenities from Airbnb"
        value={amenities}
        onChange={(e) => setAmenities(e.target.value)}
      />

      <br />
      <button>Extract amenities</button>

      {/* AI */}
      <h3>🧠 AI Knowledge</h3>
      <textarea
        placeholder={`Add everything guests might ask:
- How appliances work
- Boiler / AC
- House quirks
- Extra tips
- Anything specific

This trains your AI assistant.`}
        value={aiKnowledge}
        onChange={(e) => setAiKnowledge(e.target.value)}
      />

      <br /><br />

      <button onClick={save}>💾 Save</button>

    </div>
  )
}
