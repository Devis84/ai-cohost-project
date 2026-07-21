"use client";

import { useMemo, useState } from "react";
import { SectionHeader } from "../_components/DashboardUi";
import type { KnowledgeBase } from "../_types/dashboard";

export type SetupAssistantDraft = {
  guest_page: {
    hero_title: string;
    hero_intro: string;
    about_description: string;
    about_highlights: string;
  };
  welcome_book: {
    description: string;
    amenities: string;
    house_rules: string;
    apartment_instructions: string;
    checkout_notes: string;
    parking: string;
    extra_notes: string;
    restaurants: string;
    transport: string;
    local_guide: string;
  };
  local_guide: {
    neighbourhood_overview: string;
    restaurants: string;
    things_to_visit: string;
    transport_getting_around: string;
    host_recommendations: string;
  };
  ai_training: {
    faq: string;
    troubleshooting: string;
    guest_style: string;
    escalation_rules: string;
  };
  extra_services: {
    enabled: boolean;
    title: string;
    intro: string;
    services: string;
    host_note: string;
  };
  property_highlights: string;
  checkin_notes: string;
  parking_notes: string;
  house_rules: string;
};

type SmartSetupAssistantSectionProps = {
  propertyName: string;
  city: string;
  country: string;
  checkinNotes: string;
  knowledgeBase: KnowledgeBase;
  onApplyDraft: (draft: SetupAssistantDraft) => void;
};

function DraftPreviewCard({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-gray-500">
        {title}
      </div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
        {content || "No draft generated for this section."}
      </div>
    </div>
  );
}

export function SmartSetupAssistantSection({
  propertyName,
  city,
  country,
  checkinNotes,
  knowledgeBase,
  onApplyDraft,
}: SmartSetupAssistantSectionProps) {
  const [description, setDescription] = useState("");
  const [draft, setDraft] = useState<SetupAssistantDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [applyMessage, setApplyMessage] = useState("");

  const canGenerate = description.trim().length > 20;

  const previewItems = useMemo(() => {
    if (!draft) {
      return [] as Array<{ title: string; content: string }>;
    }

    return [
      {
        title: "Guest Page",
        content: [
          draft.guest_page.hero_title,
          draft.guest_page.hero_intro,
          draft.guest_page.about_description,
          draft.guest_page.about_highlights,
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
      {
        title: "Welcome Book",
        content: [
          draft.welcome_book.description,
          draft.welcome_book.amenities,
          draft.welcome_book.apartment_instructions,
          draft.welcome_book.checkout_notes,
          draft.welcome_book.local_guide,
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
      {
        title: "House Rules",
        content:
          draft.house_rules ||
          draft.welcome_book.house_rules,
      },
      {
        title: "Local Guide",
        content: [
          draft.local_guide.neighbourhood_overview,
          draft.local_guide.restaurants,
          draft.local_guide.things_to_visit,
          draft.local_guide.transport_getting_around,
          draft.local_guide.host_recommendations,
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
      {
        title: "AI Training",
        content: [
          draft.ai_training.faq,
          draft.ai_training.troubleshooting,
          draft.ai_training.guest_style,
          draft.ai_training.escalation_rules,
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
      {
        title: "Property Highlights",
        content:
          draft.property_highlights ||
          draft.guest_page.about_highlights,
      },
      {
        title: "Check-in Notes",
        content:
          draft.checkin_notes ||
          draft.welcome_book.apartment_instructions,
      },
      {
        title: "Parking Notes",
        content:
          draft.parking_notes ||
          draft.welcome_book.parking,
      },
      {
        title: "Extra Services",
        content: draft.extra_services.enabled
          ? [
              draft.extra_services.title,
              draft.extra_services.intro,
              draft.extra_services.services,
            ]
              .filter(Boolean)
              .join("\n\n")
          : "No extra services found in the description.",
      },
    ];
  }, [draft]);

  async function generateDraft() {
    try {
      setLoading(true);
      setErrorMessage("");
      setApplyMessage("");

      const response = await fetch("/api/dashboard/ai-autofill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description,
          property: {
            property_name: propertyName,
            city,
            country,
            checkin_instructions: checkinNotes,
            knowledge_base: knowledgeBase,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to generate draft content"
        );
      }

      setDraft(data.draft as SetupAssistantDraft);
    } catch (error) {
      setDraft(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to generate draft content"
      );
    } finally {
      setLoading(false);
    }
  }

  function applyDraft() {
    if (!draft) {
      return;
    }

    const confirmApply = window.confirm(
      "Apply this draft to the current dashboard form? This does not save to database until you click Save Changes."
    );

    if (!confirmApply) {
      return;
    }

    onApplyDraft(draft);
    setApplyMessage(
      "Draft applied to local form state. Review and click Save Changes when ready."
    );
  }

  return (
    <section className="bg-white rounded-[32px] p-6 md:p-7 shadow-xl border border-black/5">
      <SectionHeader
        icon="🧠"
        title="Smart Setup Assistant"
        description="Paste a natural property description and generate draft content for guest-facing and AI sections. Drafts are previewed first and only applied when you confirm."
      />

      <div className="rounded-3xl border border-black/10 bg-[#f6f4ef] p-5 mb-6">
        <div className="mb-2 text-sm font-bold text-gray-900">
          Property description input
        </div>
        <p className="mb-3 text-sm text-gray-600 leading-relaxed">
          Include apartment style, amenities, neighborhood, house rules,
          parking, check-in process and any extra services.
        </p>
        <textarea
          className="w-full min-h-[180px] rounded-2xl border border-gray-200 p-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20"
          placeholder="Example: Cozy two-bedroom apartment in central Florence, 5 minutes from the station..."
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={generateDraft}
            disabled={!canGenerate || loading}
            className="bg-black text-white px-6 py-3 rounded-2xl font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[220px]"
          >
            {loading
              ? "Generating draft..."
              : "Generate Draft Content"}
          </button>

          <div className="text-xs text-gray-500">
            Minimum 20 characters to generate.
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {!loading && !draft && !errorMessage && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          <div className="font-semibold text-gray-900 mb-1">No draft generated yet</div>
          <div>Paste a property description and click Generate Draft Content to preview structured suggestions.</div>
        </div>
      )}

      {draft && (
        <>
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm font-bold text-gray-900 uppercase tracking-[0.15em]">
              Draft preview
            </div>

            <button
              type="button"
              onClick={applyDraft}
              className="bg-[#0f766e] text-white px-5 py-2.5 rounded-2xl font-semibold hover:opacity-90 transition w-full sm:w-auto"
            >
              Apply Draft to Property
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {previewItems.map((item) => (
              <DraftPreviewCard
                key={item.title}
                title={item.title}
                content={item.content}
              />
            ))}
          </div>
        </>
      )}

      {applyMessage && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {applyMessage}
        </div>
      )}
    </section>
  );
}