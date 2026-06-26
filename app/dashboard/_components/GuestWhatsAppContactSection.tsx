"use client";

import { FieldLabel, SectionHeader, TextArea } from "./DashboardUi";

import type { GuestSupport } from "../_types/dashboard";

type GuestWhatsAppContactSectionProps = {
  guestSupport: GuestSupport;
  propertyName: string;
  onUpdateGuestSupport: (
    field: keyof GuestSupport,
    value: string | boolean
  ) => void;
};

function normalizeWhatsAppNumberForPreview(value: string) {
  return value.replace(/[^\d]/g, "");
}

function buildWhatsAppPreviewUrl({
  number,
  message,
}: {
  number: string;
  message: string;
}) {
  const cleanNumber = normalizeWhatsAppNumberForPreview(number);

  if (!cleanNumber) {
    return "";
  }

  const encodedMessage = encodeURIComponent(message || "");

  return encodedMessage
    ? `https://wa.me/${cleanNumber}?text=${encodedMessage}`
    : `https://wa.me/${cleanNumber}`;
}

export default function GuestWhatsAppContactSection({
  guestSupport,
  propertyName,
  onUpdateGuestSupport,
}: GuestWhatsAppContactSectionProps) {
  const defaultMessage = propertyName
    ? `Hi, I’m staying at ${propertyName} and I need some help.`
    : "Hi, I’m staying at the property and I need some help.";

  const whatsappMessage =
    guestSupport.whatsapp_message_template || defaultMessage;

  const previewUrl = buildWhatsAppPreviewUrl({
    number: guestSupport.whatsapp_number,
    message: whatsappMessage,
  });

  return (
    <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
      <SectionHeader
        icon="💬"
        title="Guest WhatsApp Contact"
        description="Add the WhatsApp number guests can use to contact the host, villa team or property manager directly from the guest page."
      />

      <div className="mb-6 rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
        <div className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-emerald-800">
          Guest-facing contact button
        </div>

        <p className="text-sm leading-relaxed text-emerald-950/75">
          When enabled, guests will see a WhatsApp contact card on the guest
          page. This is separate from the WhatsApp API automation and works with
          any normal WhatsApp number.
        </p>
      </div>

      <div className="space-y-6">
        <button
          type="button"
          onClick={() =>
            onUpdateGuestSupport(
              "whatsapp_enabled",
              !guestSupport.whatsapp_enabled
            )
          }
          className={`w-full rounded-3xl border px-6 py-5 text-left transition ${
            guestSupport.whatsapp_enabled
              ? "bg-black text-white border-black"
              : "bg-white text-gray-900 border-gray-200"
          }`}
        >
          <div className="font-bold mb-1">
            Show WhatsApp contact on Guest Page
          </div>

          <div
            className={`text-sm ${
              guestSupport.whatsapp_enabled
                ? "text-white/60"
                : "text-gray-500"
            }`}
          >
            {guestSupport.whatsapp_enabled
              ? "Enabled — guests can contact the configured WhatsApp number."
              : "Disabled — the WhatsApp contact card is hidden from guests."}
          </div>
        </button>

        <div>
          <FieldLabel
            title="WhatsApp number"
            description="Add the full international number. Example: +62 812 3456 7890 or +356 9912 3456. The guest button will automatically remove spaces and symbols."
          />

          <input
            className="w-full border border-gray-200 rounded-2xl p-4"
            placeholder="+62 812 3456 7890"
            value={guestSupport.whatsapp_number}
            onChange={(event) =>
              onUpdateGuestSupport(
                "whatsapp_number",
                event.target.value
              )
            }
          />

          <p className="mt-2 text-xs leading-relaxed text-gray-400">
            Use the country code. Do not use a local-only number.
          </p>
        </div>

        <div>
          <FieldLabel
            title="Contact label"
            description="This label is shown to guests on the guest page."
          />

          <input
            className="w-full border border-gray-200 rounded-2xl p-4"
            placeholder="Host, Villa Team, Property Manager"
            value={guestSupport.whatsapp_label}
            onChange={(event) =>
              onUpdateGuestSupport(
                "whatsapp_label",
                event.target.value
              )
            }
          />
        </div>

        <TextArea
          placeholder={defaultMessage}
          value={guestSupport.whatsapp_message_template}
          onChange={(value) =>
            onUpdateGuestSupport(
              "whatsapp_message_template",
              value
            )
          }
        />

        <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
          <div className="mb-2 text-sm font-bold text-gray-900">
            Preview
          </div>

          <p className="mb-4 text-sm leading-relaxed text-gray-500">
            Guests will open WhatsApp with this pre-filled message:
          </p>

          <div className="mb-4 rounded-2xl bg-white border border-gray-200 p-4 text-sm text-gray-700 whitespace-pre-wrap">
            {whatsappMessage}
          </div>

          {previewUrl ? (
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Test WhatsApp Link
            </a>
          ) : (
            <div className="text-sm text-gray-400">
              Add a WhatsApp number to generate the test link.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}