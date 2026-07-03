"use client";

import { SectionHeader, TextArea } from "../_components/DashboardUi";
import type { LocalGuide } from "../_types/dashboard";

interface LocalGuideSectionProps {
  knowledgeBase: {
    local_guide: LocalGuide;
  };
  onUpdateLocalGuide: (field: keyof LocalGuide, value: string) => void;
}

export function LocalGuideSection({
  knowledgeBase,
  onUpdateLocalGuide,
}: LocalGuideSectionProps) {
  return (
    <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
      <SectionHeader
        icon="📍"
        title="Local Guide"
        description="Local recommendations and area information for guests: restaurants, bars, beaches, transport and things to do."
      />

      <div className="space-y-5">
        <TextArea
          placeholder="Neighbourhood overview. Explain the area, atmosphere, nearby landmarks and what guests should know."
          value={knowledgeBase.local_guide.neighbourhood_overview}
          onChange={(value) =>
            onUpdateLocalGuide("neighbourhood_overview", value)
          }
        />

        <TextArea
          placeholder="Restaurants. Add recommended places to eat nearby."
          value={knowledgeBase.local_guide.restaurants}
          onChange={(value) => onUpdateLocalGuide("restaurants", value)}
        />

        <TextArea
          placeholder="Breakfast and coffee. Add cafés, bakeries and breakfast spots."
          value={knowledgeBase.local_guide.breakfast_coffee}
          onChange={(value) =>
            onUpdateLocalGuide("breakfast_coffee", value)
          }
        />

        <TextArea
          placeholder="Bars. Add cocktail bars, wine bars, pubs or nightlife recommendations."
          value={knowledgeBase.local_guide.bars}
          onChange={(value) => onUpdateLocalGuide("bars", value)}
        />

        <TextArea
          placeholder="Beaches. Add nearby beaches, swimming spots, rocky beaches and beach clubs."
          value={knowledgeBase.local_guide.beaches}
          onChange={(value) => onUpdateLocalGuide("beaches", value)}
        />

        <TextArea
          placeholder="Things to visit. Add attractions, sightseeing ideas, day trips and cultural places."
          value={knowledgeBase.local_guide.things_to_visit}
          onChange={(value) =>
            onUpdateLocalGuide("things_to_visit", value)
          }
        />

        <TextArea
          placeholder="Transport and getting around. Add airport transfer, buses, ferries, Bolt/Uber, taxis and walking tips."
          value={knowledgeBase.local_guide.transport_getting_around}
          onChange={(value) =>
            onUpdateLocalGuide("transport_getting_around", value)
          }
        />

        <TextArea
          placeholder="Useful services. Add supermarkets, pharmacies, clinics, ATMs, laundry, gyms or other practical services."
          value={knowledgeBase.local_guide.useful_services}
          onChange={(value) =>
            onUpdateLocalGuide("useful_services", value)
          }
        />

        <TextArea
          placeholder="Host recommendations. Add your personal favourites and practical tips."
          value={knowledgeBase.local_guide.host_recommendations}
          onChange={(value) =>
            onUpdateLocalGuide("host_recommendations", value)
          }
          large
        />
      </div>
    </section>
  );
}
