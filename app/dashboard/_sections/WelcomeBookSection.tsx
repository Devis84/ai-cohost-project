"use client";

import { SectionHeader, TextArea } from "../_components/DashboardUi";
import type { WelcomeBook } from "../_types/dashboard";

interface WelcomeBookSectionProps {
  knowledgeBase: {
    welcome_book: WelcomeBook;
  };
  onUpdateWelcomeBook: (field: keyof WelcomeBook, value: string) => void;
}

export function WelcomeBookSection({
  knowledgeBase,
  onUpdateWelcomeBook,
}: WelcomeBookSectionProps) {
  return (
    <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
      <SectionHeader
        icon="📘"
        title="Welcome Book"
        description="House manual and practical apartment information visible to guests during their stay."
      />

      <div className="space-y-5">
        <TextArea
          placeholder="Amenities. Amenities available in the apartment."
          value={knowledgeBase.welcome_book.amenities}
          onChange={(value) => onUpdateWelcomeBook("amenities", value)}
        />

        <TextArea
          placeholder="General apartment instructions. Add general instructions guests should follow while using the apartment."
          value={knowledgeBase.welcome_book.apartment_instructions}
          onChange={(value) =>
            onUpdateWelcomeBook("apartment_instructions", value)
          }
        />

        <TextArea
          placeholder="Kitchen instructions. Add appliances, basic supplies and usage notes."
          value={knowledgeBase.welcome_book.kitchen}
          onChange={(value) => onUpdateWelcomeBook("kitchen", value)}
        />

        <TextArea
          placeholder="Washing machine instructions. Explain how guests can use the washing machine."
          value={knowledgeBase.welcome_book.washing_machine}
          onChange={(value) =>
            onUpdateWelcomeBook("washing_machine", value)
          }
        />

        <TextArea
          placeholder="Air conditioning instructions. Explain how guests should use the air conditioning."
          value={knowledgeBase.welcome_book.ac}
          onChange={(value) => onUpdateWelcomeBook("ac", value)}
        />

        <TextArea
          placeholder="Boiler / hot water instructions. Explain anything guests should know about hot water."
          value={knowledgeBase.welcome_book.boiler}
          onChange={(value) => onUpdateWelcomeBook("boiler", value)}
        />

        <TextArea
          placeholder="Trash and recycling instructions. Explain rubbish collection, recycling rules and check-out rubbish instructions."
          value={knowledgeBase.welcome_book.trash}
          onChange={(value) => onUpdateWelcomeBook("trash", value)}
        />

        <TextArea
          placeholder="Towels and linen instructions. Explain provided towels, linen and extra towel rules."
          value={knowledgeBase.welcome_book.towels_linen}
          onChange={(value) =>
            onUpdateWelcomeBook("towels_linen", value)
          }
        />

        <TextArea
          placeholder="Beach towels instructions. Explain where beach towels are located and how guests may use them."
          value={knowledgeBase.welcome_book.beach_towels}
          onChange={(value) =>
            onUpdateWelcomeBook("beach_towels", value)
          }
        />

        <TextArea
          placeholder="Parking information. Explain parking availability, limitations and useful parking notes."
          value={knowledgeBase.welcome_book.parking}
          onChange={(value) => onUpdateWelcomeBook("parking", value)}
        />

        <TextArea
          placeholder="Emergency information. Add emergency information visible to guests."
          value={knowledgeBase.welcome_book.emergency}
          onChange={(value) => onUpdateWelcomeBook("emergency", value)}
        />

        <TextArea
          placeholder="Extra house notes. Add extra notes specific to this property."
          value={knowledgeBase.welcome_book.extra_notes}
          onChange={(value) => onUpdateWelcomeBook("extra_notes", value)}
          large
        />
      </div>
    </section>
  );
}
