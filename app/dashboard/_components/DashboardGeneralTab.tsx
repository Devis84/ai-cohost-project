"use client";

import {

  FieldLabel,

  SectionHeader,

  TextArea,

} from "./DashboardUi";

import {

  createSlug,

  getPropertyIdentifier,

} from "../_lib/dashboard-utils";

import type {

  ExtraServices,

  KnowledgeBase,

  LocalGuide,

  Property,

  WelcomeBook,

} from "../_types/dashboard";

export function DashboardGeneralTab({

  properties,

  selectedSlug,

  loadingProperties,

  propertyName,

  newProperty,

  city,

  country,

  address,

  wifiName,

  wifiPassword,

  checkin,

  checkout,

  checkinNotes,

  lockboxCode,

  emergencyNumbers,

  knowledgeBase,

  aiEnabled,

  whatsappEnabled,

  telegramEnabled,

  welcomebookEnabled,

  onSelectProperty,

  onDeleteProperty,

  onAddProperty,

  onCopyWifi,

  onCopyGuestUrl,

  onSetPropertyName,

  onSetNewProperty,

  onSetCity,

  onSetCountry,

  onSetAddress,

  onSetWifiName,

  onSetWifiPassword,

  onSetCheckin,

  onSetCheckout,

  onSetCheckinNotes,

  onSetLockboxCode,

  onSetEmergencyNumbers,

  onSetAiEnabled,

  onSetWhatsappEnabled,

  onSetTelegramEnabled,

  onSetWelcomebookEnabled,

  onUpdateWelcomeBook,

  onUpdateLocalGuide,

  onUpdateExtraServices,

}: {

  properties: Property[];

  selectedSlug: string;

  loadingProperties: boolean;

  propertyName: string;

  newProperty: string;

  city: string;

  country: string;

  address: string;

  wifiName: string;

  wifiPassword: string;

  checkin: string;

  checkout: string;

  checkinNotes: string;

  lockboxCode: string;

  emergencyNumbers: string;

  knowledgeBase: KnowledgeBase;

  aiEnabled: boolean;

  whatsappEnabled: boolean;

  telegramEnabled: boolean;

  welcomebookEnabled: boolean;

  onSelectProperty: (value: string) => void;

  onDeleteProperty: () => void;

  onAddProperty: () => void;

  onCopyWifi: () => void;

  onCopyGuestUrl: () => void;

  onSetPropertyName: (value: string) => void;

  onSetNewProperty: (value: string) => void;

  onSetCity: (value: string) => void;

  onSetCountry: (value: string) => void;

  onSetAddress: (value: string) => void;

  onSetWifiName: (value: string) => void;

  onSetWifiPassword: (value: string) => void;

  onSetCheckin: (value: string) => void;

  onSetCheckout: (value: string) => void;

  onSetCheckinNotes: (value: string) => void;

  onSetLockboxCode: (value: string) => void;

  onSetEmergencyNumbers: (value: string) => void;

  onSetAiEnabled: (value: boolean) => void;

  onSetWhatsappEnabled: (value: boolean) => void;

  onSetTelegramEnabled: (value: boolean) => void;

  onSetWelcomebookEnabled: (value: boolean) => void;

  onUpdateWelcomeBook: (

    field: keyof WelcomeBook,

    value: string

  ) => void;

  onUpdateLocalGuide: (

    field: keyof LocalGuide,

    value: string

  ) => void;

  onUpdateExtraServices: (

    field: keyof ExtraServices,

    value: string | boolean

  ) => void;

}) {

  return (

    <>

      <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">

        <SectionHeader

          icon="🏡"

          title="Property Identity"

          description="Select, create or rename the property that will be shown to guests."

        />

        <div className="grid md:grid-cols-[1fr_auto] gap-4 mb-4">

          <select

            className="w-full border border-gray-200 rounded-2xl p-4 bg-white"

            value={selectedSlug}

            onChange={(event) =>

              onSelectProperty(event.target.value)

            }

            disabled={loadingProperties}

          >

            <option value="">

              {loadingProperties

                ? "Loading properties..."

                : "Select property"}

            </option>

            {properties.map((property) => (

              <option

                key={property.id}

                value={getPropertyIdentifier(property)}

              >

                {property.property_name}

              </option>

            ))}

          </select>

          <button

            onClick={onDeleteProperty}

            className="bg-red-500 hover:bg-red-600 text-white px-6 rounded-2xl transition"

          >

            Delete

          </button>

        </div>

        <div className="grid md:grid-cols-[1fr_auto] gap-3 mb-4">

          <input

            className="border border-gray-200 rounded-2xl p-4"

            placeholder="Add new property, e.g. Big House"

            value={newProperty}

            onChange={(event) =>

              onSetNewProperty(event.target.value)

            }

          />

          <button

            className="bg-black text-white px-6 rounded-2xl"

            onClick={onAddProperty}

          >

            + Add Property

          </button>

        </div>

        <div className="grid md:grid-cols-2 gap-4">

          <div>

            <FieldLabel

              title="Property display name"

              description="This is the property name shown in the dashboard and guest page."

            />

            <input

              className="w-full border border-gray-200 rounded-2xl p-4"

              placeholder="Example: Maltese Maisonette"

              value={propertyName}

              onChange={(event) =>

                onSetPropertyName(event.target.value)

              }

            />

          </div>

          <div>

            <FieldLabel

              title="Property slug"

              description="Read-only URL identifier used for the guest page and QR/NFC link. Create a new property to use a different slug."

            />

            <input

              className="w-full border border-gray-200 rounded-2xl p-4 bg-gray-50 text-gray-500 cursor-not-allowed"

              placeholder="Example: maltese-maisonette"

              value={

                selectedSlug ||

                createSlug(propertyName)

              }

              readOnly

            />

          </div>

        </div>

        {selectedSlug && (

          <div className="mt-5 flex flex-wrap gap-3">

            <a

              href={`/guest/${selectedSlug}`}

              target="_blank"

              className="bg-gray-100 hover:bg-gray-200 px-5 py-3 rounded-2xl text-sm font-semibold"

            >

              Open Guest Page

            </a>

            <button

              type="button"

              onClick={onCopyGuestUrl}

              className="bg-gray-100 hover:bg-gray-200 px-5 py-3 rounded-2xl text-sm font-semibold"

            >

              Copy Guest URL

            </button>

            <a

              href="/dashboard/qr"

              className="bg-black text-white hover:opacity-90 px-5 py-3 rounded-2xl text-sm font-semibold"

            >

              Guest Access QR/NFC

            </a>

            <a

              href={`/api/properties/${selectedSlug}`}

              target="_blank"

              className="bg-gray-100 hover:bg-gray-200 px-5 py-3 rounded-2xl text-sm font-semibold"

            >

              View API Data

            </a>

          </div>

        )}

      </section>

      <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">

        <SectionHeader

          icon="📝"

          title="Property Description"

          description="Add the main description of the property. You can paste the same text used on Airbnb, Booking.com or your direct listing."

        />

        <TextArea

          placeholder="Property description. Paste the property description used on Airbnb, Booking.com or your direct listing."

          value={knowledgeBase.welcome_book.description}

          onChange={(value) =>

            onUpdateWelcomeBook(

              "description",

              value

            )

          }

          large

        />

      </section>

      <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">

        <SectionHeader

          icon="📍"

          title="Location & Arrival"

          description="Add the location details and useful arrival information for guests."

        />

        <div className="grid md:grid-cols-2 gap-4 mb-4">

          <div>

            <FieldLabel

              title="Town / City"

              description="The town or area where the property is located."

            />

            <input

              className="w-full border border-gray-200 rounded-2xl p-4"

              placeholder="Example: Sliema"

              value={city}

              onChange={(event) =>

                onSetCity(event.target.value)

              }

            />

          </div>

          <div>

            <FieldLabel

              title="Country"

              description="The country where the property is located."

            />

            <input

              className="w-full border border-gray-200 rounded-2xl p-4"

              placeholder="Example: Malta"

              value={country}

              onChange={(event) =>

                onSetCountry(event.target.value)

              }

            />

          </div>

        </div>

        <div className="mb-5">

          <FieldLabel

            title="Full address"

            description="Full property address for host reference and guest arrival instructions."

          />

          <input

            className="w-full border border-gray-200 rounded-2xl p-4"

            placeholder="Enter the full property address"

            value={address}

            onChange={(event) =>

              onSetAddress(event.target.value)

            }

          />

        </div>

        <TextArea

          placeholder="How to reach the property from the airport. Add taxi, Bolt/Uber, public transport, approximate travel time and useful arrival tips."

          value={knowledgeBase.local_guide.transport_getting_around}

          onChange={(value) =>

            onUpdateLocalGuide(

              "transport_getting_around",

              value

            )

          }

        />

      </section>

      <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">

          <SectionHeader

            icon="📶"

            title="Wi-Fi"

            description="Add the Wi-Fi details guests should use during their stay."

          />

          <button

            onClick={onCopyWifi}

            className="bg-black text-white px-5 py-3 rounded-2xl"

          >

            Copy Wi-Fi

          </button>

        </div>

        <div className="grid md:grid-cols-2 gap-4">

          <div>

            <FieldLabel

              title="Wi-Fi network name"

              description="The network name guests should select on their device."

            />

            <input

              className="w-full border border-gray-200 rounded-2xl p-4"

              placeholder="Example: Melita-XXXX"

              value={wifiName}

              onChange={(event) =>

                onSetWifiName(event.target.value)

              }

            />

          </div>

          <div>

            <FieldLabel

              title="Wi-Fi password"

              description="The password guests should use to connect."

            />

            <input

              className="w-full border border-gray-200 rounded-2xl p-4"

              placeholder="Enter the Wi-Fi password"

              value={wifiPassword}

              onChange={(event) =>

                onSetWifiPassword(event.target.value)

              }

            />

          </div>

        </div>

      </section>

      <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">

        <SectionHeader

          icon="🔑"

          title="Check-in & Access"

          description="Add the arrival instructions, access method and any lockbox or door code guests may need."

        />

        <div className="grid md:grid-cols-2 gap-4 mb-4">

          <div>

            <FieldLabel

              title="Check-in time"

              description="The earliest time guests can check in."

            />

            <input

              className="w-full border border-gray-200 rounded-2xl p-4"

              placeholder="Example: 15:00"

              value={checkin}

              onChange={(event) =>

                onSetCheckin(event.target.value)

              }

            />

          </div>

          <div>

            <FieldLabel

              title="Check-out time"

              description="The latest time guests should leave the property."

            />

            <input

              className="w-full border border-gray-200 rounded-2xl p-4"

              placeholder="Example: 10:00"

              value={checkout}

              onChange={(event) =>

                onSetCheckout(event.target.value)

              }

            />

          </div>

        </div>

        <div className="mb-4">

          <FieldLabel

            title="Check-in instructions"

            description="Explain how guests access the property, where to find the keys, door details, lockbox instructions or any important arrival notes."

          />

          <textarea

            className="w-full border border-gray-200 rounded-2xl p-4 min-h-[180px]"

            placeholder="Example: The keys are located in the lockbox near the entrance. Enter the code, collect the keys and make sure to close the lockbox after use."

            value={checkinNotes}

            onChange={(event) =>

              onSetCheckinNotes(event.target.value)

            }

          />

        </div>

        <FieldLabel

          title="Lockbox / door code"

          description="Enter the lockbox PIN, smart lock code or access code if applicable."

        />

        <input

          className="w-full border border-gray-200 rounded-2xl p-4"

          placeholder="Example: 1234"

          value={lockboxCode}

          onChange={(event) =>

            onSetLockboxCode(event.target.value)

          }

        />

      </section>

      <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">

        <SectionHeader

          icon="📋"

          title="House Rules"

          description="Add the main house rules guests should follow during their stay."

        />

        <TextArea

          placeholder="House rules. Add the main house rules for this property."

          value={knowledgeBase.welcome_book.house_rules}

          onChange={(value) =>

            onUpdateWelcomeBook(

              "house_rules",

              value

            )

          }

          large

        />

      </section>

      <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">

        <SectionHeader

          icon="🚪"

          title="Check-out Instructions"

          description="Explain what guests should do before leaving the property."

        />

        <TextArea

          placeholder="Check-out instructions. Add check-out instructions for guests."

          value={knowledgeBase.welcome_book.checkout_notes}

          onChange={(value) =>

            onUpdateWelcomeBook(

              "checkout_notes",

              value

            )

          }

          large

        />

      </section>

      <section className="bg-white rounded-[32px] p-7 shadow-xl border border-red-100">

        <SectionHeader

          icon="🚨"

          title="Emergency Contacts"

          description="Add emergency numbers, host contact, maintenance contact or useful local emergency information."

        />

        <textarea

          className="w-full border border-gray-200 rounded-2xl p-4 min-h-[180px]"

          placeholder="Add emergency contacts and useful numbers."

          value={emergencyNumbers}

          onChange={(event) =>

            onSetEmergencyNumbers(event.target.value)

          }

        />

      </section>

      <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">

        <SectionHeader

          icon="⚙️"

          title="Modules"

          description="Enable or disable guest-facing modules for this property."

        />

        <div className="grid md:grid-cols-2 gap-4">

          <label className="flex items-center justify-between bg-gray-50 rounded-2xl p-5">

            <span>AI Concierge</span>

            <input

              type="checkbox"

              checked={aiEnabled}

              onChange={(event) =>

                onSetAiEnabled(event.target.checked)

              }

            />

          </label>

          <label className="flex items-center justify-between bg-gray-50 rounded-2xl p-5">

            <span>WhatsApp Integration</span>

            <input

              type="checkbox"

              checked={whatsappEnabled}

              onChange={(event) =>

                onSetWhatsappEnabled(event.target.checked)

              }

            />

          </label>

          <label className="flex items-center justify-between bg-gray-50 rounded-2xl p-5">

            <span>Telegram Integration</span>

            <input

              type="checkbox"

              checked={telegramEnabled}

              onChange={(event) =>

                onSetTelegramEnabled(event.target.checked)

              }

            />

          </label>

          <label className="flex items-center justify-between bg-gray-50 rounded-2xl p-5">

            <span>Welcome Book</span>

            <input

              type="checkbox"

              checked={welcomebookEnabled}

              onChange={(event) =>

                onSetWelcomebookEnabled(

                  event.target.checked

                )

              }

            />

          </label>

          <label className="flex items-center justify-between bg-gray-50 rounded-2xl p-5">

            <span>Extra Services</span>

            <input

              type="checkbox"

              checked={knowledgeBase.extra_services.enabled}

              onChange={(event) =>

                onUpdateExtraServices(

                  "enabled",

                  event.target.checked

                )

              }

            />

          </label>

        </div>

      </section>

    </>

  );

}