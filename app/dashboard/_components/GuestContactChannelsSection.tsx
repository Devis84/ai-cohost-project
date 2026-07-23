 "use client";

import {
  FieldLabel,
  SectionHeader,
  TextArea,
} from "./DashboardUi";

import type { GuestSupport } from "../_types/dashboard";

type GuestContactChannelsSectionProps = {
  guestSupport: GuestSupport;
  propertyName: string;
  onUpdateGuestSupport: (
    field: keyof GuestSupport,
    value: string | boolean
  ) => void;
};

function normalizeWhatsAppNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

function normalizeTelegramUsername(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\/t\.me\//i, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "");
}

function buildWhatsAppUrl({
  number,
  message,
}: {
  number: string;
  message: string;
}) {
  const cleanNumber =
    normalizeWhatsAppNumber(number);

  if (!cleanNumber) {
    return "";
  }

  const encodedMessage =
    encodeURIComponent(message);

  return encodedMessage
    ? `https://wa.me/${cleanNumber}?text=${encodedMessage}`
    : `https://wa.me/${cleanNumber}`;
}

function buildTelegramUrl({
  username,
  message,
}: {
  username: string;
  message: string;
}) {
  const cleanUsername =
    normalizeTelegramUsername(username);

  if (!cleanUsername) {
    return "";
  }

  const encodedMessage =
    encodeURIComponent(message);

  return encodedMessage
    ? `https://t.me/${cleanUsername}?text=${encodedMessage}`
    : `https://t.me/${cleanUsername}`;
}

function ToggleSwitch({
  enabled,
  label,
  onChange,
}: {
  enabled: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onChange}
      className="inline-flex items-center gap-3"
    >
      <span
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
          enabled
            ? "bg-emerald-500"
            : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
            enabled
              ? "translate-x-6"
              : "translate-x-1"
          }`}
        />
      </span>

      <span
        className={`text-sm font-bold ${
          enabled
            ? "text-emerald-700"
            : "text-gray-500"
        }`}
      >
        {enabled ? "Enabled" : "Disabled"}
      </span>
    </button>
  );
}

function ChannelHeader({
  icon,
  title,
  description,
  enabled,
  onToggle,
}: {
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-2xl">
            {icon}
          </span>

          <h3 className="text-2xl font-black text-gray-950">
            {title}
          </h3>
        </div>

        <p className="text-sm leading-relaxed text-gray-500">
          {description}
        </p>
      </div>

      <ToggleSwitch
        enabled={enabled}
        label={`Toggle ${title}`}
        onChange={onToggle}
      />
    </div>
  );
}

export default function GuestContactChannelsSection({
  guestSupport,
  propertyName,
  onUpdateGuestSupport,
}: GuestContactChannelsSectionProps) {
  const defaultMessage = propertyName
    ? `Hi, I’m staying at ${propertyName} and I need some help.`
    : "Hi, I’m staying at the property and I need some help.";

  const whatsappMessage =
    guestSupport.whatsapp_message_template ||
    defaultMessage;

  const telegramMessage =
    guestSupport.telegram_message_template ||
    defaultMessage;

  const whatsappPreviewUrl =
    buildWhatsAppUrl({
      number:
        guestSupport.whatsapp_number,
      message: whatsappMessage,
    });

  const telegramPreviewUrl =
    buildTelegramUrl({
      username:
        guestSupport.telegram_username,
      message: telegramMessage,
    });

  return (
    <div className="space-y-6">
      <section
        className={`rounded-[32px] border bg-white p-7 shadow-xl transition ${
          guestSupport.whatsapp_enabled
            ? "border-emerald-100"
            : "border-black/5"
        }`}
      >
        <ChannelHeader
          icon="🟢"
          title="WhatsApp Contact"
          description="Allow guests to open a WhatsApp conversation with the configured host number."
          enabled={
            guestSupport.whatsapp_enabled
          }
          onToggle={() =>
            onUpdateGuestSupport(
              "whatsapp_enabled",
              !guestSupport.whatsapp_enabled
            )
          }
        />

        <div
          className={`space-y-6 transition ${
            guestSupport.whatsapp_enabled
              ? "opacity-100"
              : "opacity-60"
          }`}
        >
          <div>
            <FieldLabel
              title="WhatsApp number"
              description="Use the full international number including country code."
            />

            <input
              className="w-full rounded-2xl border border-gray-200 p-4"
              placeholder="+356 99123456"
              value={
                guestSupport.whatsapp_number
              }
              onChange={(event) =>
                onUpdateGuestSupport(
                  "whatsapp_number",
                  event.target.value
                )
              }
            />
          </div>

          <div>
            <FieldLabel
              title="WhatsApp contact label"
              description="Example: Host, Villa Team or Property Manager."
            />

            <input
              className="w-full rounded-2xl border border-gray-200 p-4"
              placeholder="Host"
              value={
                guestSupport.whatsapp_label
              }
              onChange={(event) =>
                onUpdateGuestSupport(
                  "whatsapp_label",
                  event.target.value
                )
              }
            />
          </div>

          <div>
            <FieldLabel
              title="WhatsApp pre-filled message"
              description="This message will be prepared automatically when the guest opens WhatsApp."
            />

            <TextArea
              placeholder={defaultMessage}
              value={
                guestSupport.whatsapp_message_template
              }
              onChange={(value) =>
                onUpdateGuestSupport(
                  "whatsapp_message_template",
                  value
                )
              }
            />
          </div>

          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
            <div className="mb-2 font-bold text-gray-900">
              WhatsApp preview
            </div>

            <div className="mb-4 whitespace-pre-wrap rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
              {whatsappMessage}
            </div>

            {whatsappPreviewUrl ? (
              <a
                href={whatsappPreviewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Test WhatsApp Link
              </a>
            ) : (
              <div className="text-sm text-gray-400">
                Add a WhatsApp number to
                test the link.
              </div>
            )}
          </div>
        </div>
      </section>

      <section
        className={`rounded-[32px] border bg-white p-7 shadow-xl transition ${
          guestSupport.telegram_enabled
            ? "border-sky-100"
            : "border-black/5"
        }`}
      >
        <ChannelHeader
          icon="✈️"
          title="Telegram Contact"
          description="Allow guests to open a Telegram conversation with the configured host username."
          enabled={
            guestSupport.telegram_enabled
          }
          onToggle={() =>
            onUpdateGuestSupport(
              "telegram_enabled",
              !guestSupport.telegram_enabled
            )
          }
        />

        <div
          className={`space-y-6 transition ${
            guestSupport.telegram_enabled
              ? "opacity-100"
              : "opacity-60"
          }`}
        >
          <div>
            <FieldLabel
              title="Telegram username"
              description="Enter the public username only. The @ symbol is optional."
            />

            <input
              className="w-full rounded-2xl border border-gray-200 p-4"
              placeholder="@Dave_bali"
              value={
                guestSupport.telegram_username
              }
              onChange={(event) =>
                onUpdateGuestSupport(
                  "telegram_username",
                  event.target.value
                )
              }
            />
          </div>

          <div>
            <FieldLabel
              title="Telegram contact label"
              description="Example: Host, Villa Team or Property Manager."
            />

            <input
              className="w-full rounded-2xl border border-gray-200 p-4"
              placeholder="Host"
              value={
                guestSupport.telegram_label
              }
              onChange={(event) =>
                onUpdateGuestSupport(
                  "telegram_label",
                  event.target.value
                )
              }
            />
          </div>

          <div>
            <FieldLabel
              title="Telegram pre-filled message"
              description="This message will be prepared automatically when the guest opens Telegram."
            />

            <TextArea
              placeholder={defaultMessage}
              value={
                guestSupport.telegram_message_template
              }
              onChange={(value) =>
                onUpdateGuestSupport(
                  "telegram_message_template",
                  value
                )
              }
            />
          </div>

          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
            <div className="mb-2 font-bold text-gray-900">
              Telegram preview
            </div>

            <div className="mb-4 whitespace-pre-wrap rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
              {telegramMessage}
            </div>

            {telegramPreviewUrl ? (
              <a
                href={telegramPreviewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
              >
                Test Telegram Link
              </a>
            ) : (
              <div className="text-sm text-gray-400">
                Add a Telegram username to
                test the link.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}