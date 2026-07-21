"use client";

import { FieldLabel, SectionHeader, TextArea } from "../_components/DashboardUi";
import type { ExtraServices } from "../_types/dashboard";

interface ExtraServicesSectionProps {
  knowledgeBase: {
    extra_services: ExtraServices;
  };
  onUpdateExtraServices: (
    field: keyof ExtraServices,
    value: string | boolean
  ) => void;
  onApplyTemplate: () => void;
}

export function ExtraServicesSection({
  knowledgeBase,
  onUpdateExtraServices,
  onApplyTemplate,
}: ExtraServicesSectionProps) {
  return (
    <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
      <SectionHeader
        icon="🛎️"
        title="Extra Services / Upselling"
        description="Optional guest-facing services, partner offers and upselling opportunities. Keep this disabled until you have real services to show."
      />

      <div className="mb-6 bg-amber-50 border border-amber-100 rounded-3xl p-5">
        <div className="font-bold text-amber-950 mb-2">
          Optional revenue module
        </div>

        <p className="text-sm text-amber-900/70 leading-relaxed">
          Use this section for future upselling: scooter rental, car rental,
          airport transfers, tours, excursions, massages, private chef,
          breakfast baskets, late checkout, luggage storage, beach clubs,
          restaurant discounts or local partnerships.
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid md:grid-cols-[1fr_auto] gap-4 items-stretch">
          <button
            type="button"
            onClick={() =>
              onUpdateExtraServices(
                "enabled",
                !knowledgeBase.extra_services.enabled
              )
            }
            className={`w-full rounded-3xl border px-6 py-5 text-left transition ${
              knowledgeBase.extra_services.enabled
                ? "bg-black text-white border-black"
                : "bg-white text-gray-900 border-gray-200"
            }`}
          >
            <div className="font-bold mb-1">
              Show Extra Services on Guest Page
            </div>

            <div
              className={`text-sm ${
                knowledgeBase.extra_services.enabled
                  ? "text-white/60"
                  : "text-gray-500"
              }`}
            >
              {knowledgeBase.extra_services.enabled
                ? "Enabled — guests can see this module when content is available."
                : "Disabled — the module is saved but hidden from guests."}
            </div>
          </button>

          <button
            type="button"
            onClick={onApplyTemplate}
            className="bg-[#f4f1eb] text-black border border-black/5 rounded-3xl px-6 py-5 font-semibold hover:bg-[#ebe6dd] transition"
          >
            Use Template
          </button>
        </div>

        <div>
          <FieldLabel
            title="Section title"
            description="Guest-facing title shown on the guest page."
          />

          <input
            className="w-full border border-gray-200 rounded-2xl p-4"
            placeholder="Extra Services"
            value={knowledgeBase.extra_services.title}
            onChange={(event) =>
              onUpdateExtraServices("title", event.target.value)
            }
          />
        </div>

        <TextArea
          placeholder="Guest intro. Short intro shown to guests above the services list."
          value={knowledgeBase.extra_services.intro}
          onChange={(value) => onUpdateExtraServices("intro", value)}
        />

        <TextArea
          placeholder="Services and offers. Add one service per line. Example: Airport transfer — Contact host for availability and price."
          value={knowledgeBase.extra_services.services}
          onChange={(value) => onUpdateExtraServices("services", value)}
          large
        />

        <TextArea
          placeholder="Internal host note. Add partner contacts, prices, commissions, availability rules and services that require manual host approval. This is not shown to guests."
          value={knowledgeBase.extra_services.host_note}
          onChange={(value) => onUpdateExtraServices("host_note", value)}
        />
      </div>
    </section>
  );
}
