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
  const [description, setDescription] = useState('')
  const [amenities, setAmenities] = useState('')
  const [aiKnowledge, setAiKnowledge] = useState('')
  const [contacts, setContacts] = useState<string[]>([])

  // CHECK-IN EXPERIENCE
  const [lockboxCode, setLockboxCode] = useState('')
  const [buildingAccess, setBuildingAccess] = useState('')
  const [apartmentFloor, setApartmentFloor] = useState('')
  const [parkingInfo, setParkingInfo] = useState('')

  // LOCAL INFO
  const [supermarketInfo, setSupermarketInfo] = useState('')
  const [pharmacyInfo, setPharmacyInfo] = useState('')
  const [restaurantInfo, setRestaurantInfo] = useState('')
  const [transportInfo, setTransportInfo] = useState('')
  const [airportInfo, setAirportInfo] = useState('')

  // EMERGENCY
  const [emergencyNumbers, setEmergencyNumbers] = useState('')
  const [hospitalInfo, setHospitalInfo] = useState('')
  const [policeInfo, setPoliceInfo] = useState('')
  const [hostEmergency, setHostEmergency] = useState('')

  // HOUSE MANUAL
  const [acInfo, setAcInfo] = useState('')
  const [boilerInfo, setBoilerInfo] = useState('')
  const [kitchenInfo, setKitchenInfo] = useState('')
  const [trashInfo, setTrashInfo] = useState('')
  const [checkoutChecklist, setCheckoutChecklist] = useState('')

  // MODULES
  const [cleaningEnabled, setCleaningEnabled] = useState(false)
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
    setDescription(data.description || '')
    setAmenities(data.amenities || '')
    setAiKnowledge(data.ai_knowledge || '')

    // CHECK-IN EXPERIENCE
    setLockboxCode(data.lockbox_code || '')
    setBuildingAccess(data.building_access || '')
    setApartmentFloor(data.apartment_floor || '')
    setParkingInfo(data.parking_info || '')

    // LOCAL INFO
    setSupermarketInfo(data.supermarket_info || '')
    setPharmacyInfo(data.pharmacy_info || '')
    setRestaurantInfo(data.restaurant_info || '')
    setTransportInfo(data.transport_info || '')
    setAirportInfo(data.airport_info || '')

    // EMERGENCY
    setEmergencyNumbers(data.emergency_numbers || '')
    setHospitalInfo(data.hospital_info || '')
    setPoliceInfo(data.police_info || '')
    setHostEmergency(data.host_emergency || '')

    // HOUSE MANUAL
    setAcInfo(data.ac_info || '')
    setBoilerInfo(data.boiler_info || '')
    setKitchenInfo(data.kitchen_info || '')
    setTrashInfo(data.trash_info || '')
    setCheckoutChecklist(data.checkout_checklist || '')

    // MODULES
    setCleaningEnabled(data.cleaning_enabled || false)
    setAiEnabled(data.ai_enabled ?? true)
    setWhatsappEnabled(data.whatsapp_enabled || false)
    setTelegramEnabled(data.telegram_enabled || false)
    setWelcomebookEnabled(data.welcomebook_enabled ?? true)
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
      description,
      amenities,
      ai_knowledge: aiKnowledge,

      // CHECK-IN EXPERIENCE
      lockbox_code: lockboxCode,
      building_access: buildingAccess,
      apartment_floor: apartmentFloor,
      parking_info: parkingInfo,

      // LOCAL INFO
      supermarket_info: supermarketInfo,
      pharmacy_info: pharmacyInfo,
      restaurant_info: restaurantInfo,
      transport_info: transportInfo,
      airport_info: airportInfo,

      // EMERGENCY
      emergency_numbers: emergencyNumbers,
      hospital_info: hospitalInfo,
      police_info: policeInfo,
      host_emergency: hostEmergency,

      // HOUSE MANUAL
      ac_info: acInfo,
      boiler_info: boilerInfo,
      kitchen_info: kitchenInfo,
      trash_info: trashInfo,
      checkout_checklist: checkoutChecklist,

      // MODULES
      cleaning_enabled: cleaningEnabled,
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

    <div className="min-h-screen bg-gray-100 py-10 px-4">

      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8 space-y-8">

        <h1 className="text-3xl font-bold">
          🏡 AI Co-Host Dashboard
        </h1>

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

            <button
              className="bg-red-600 text-white px-4 rounded-lg"
              onClick={deleteProperty}
            >
              Delete
            </button>

          </div>

        </section>

        {/* LOCATION */}
        <section className="space-y-4">

          <h2 className="text-xl font-semibold">
            📍 Location
          </h2>

          <div className="grid grid-cols-2 gap-4">

            <input
              className="border rounded-lg p-3"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />

            <input
              className="border rounded-lg p-3"
              placeholder="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />

          </div>

          <input
            className="w-full border rounded-lg p-3"
            placeholder="Full address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

        </section>

      </div>
    </div>
  )
}