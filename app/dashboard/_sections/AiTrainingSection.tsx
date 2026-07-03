"use client";

import { SectionHeader, TextArea } from "../_components/DashboardUi";
import type { AiTraining } from "../_types/dashboard";

interface AiTrainingSectionProps {
  knowledgeBase: {
    ai_training: AiTraining;
  };
  onUpdateAiTraining: (field: keyof AiTraining, value: string) => void;
}

export function AiTrainingSection({
  knowledgeBase,
  onUpdateAiTraining,
}: AiTrainingSectionProps) {
  return (
    <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
      <SectionHeader
        icon="🤖"
        title="AI Training"
        description="Internal instructions used by the AI concierge. These notes help the assistant answer correctly and escalate when needed."
      />

      <div className="space-y-5">
        <TextArea
          placeholder="FAQs. Add common guest questions and preferred answers."
          value={knowledgeBase.ai_training.faq}
          onChange={(value) => onUpdateAiTraining("faq", value)}
        />

        <TextArea
          placeholder="Troubleshooting. Add instructions for common apartment issues such as Wi-Fi, AC, hot water, keys, access or appliances."
          value={knowledgeBase.ai_training.troubleshooting}
          onChange={(value) =>
            onUpdateAiTraining("troubleshooting", value)
          }
        />

        <TextArea
          placeholder="Guest communication style. Explain tone, language, length of answers and hospitality style."
          value={knowledgeBase.ai_training.guest_style}
          onChange={(value) => onUpdateAiTraining("guest_style", value)}
        />

        <TextArea
          placeholder="Complaint handling. Explain how the AI should respond to complaints, unhappy guests or sensitive situations."
          value={knowledgeBase.ai_training.complaint_handling}
          onChange={(value) =>
            onUpdateAiTraining("complaint_handling", value)
          }
        />

        <TextArea
          placeholder="Escalation rules. Explain when the AI should tell the guest to contact the host immediately."
          value={knowledgeBase.ai_training.escalation_rules}
          onChange={(value) =>
            onUpdateAiTraining("escalation_rules", value)
          }
        />

        <TextArea
          placeholder="Hidden operational notes. Internal host notes that should guide the AI but should not be shown directly to guests."
          value={knowledgeBase.ai_training.hidden_notes}
          onChange={(value) => onUpdateAiTraining("hidden_notes", value)}
        />

        <TextArea
          placeholder="Additional AI notes. Add any additional instruction for the AI concierge."
          value={knowledgeBase.ai_training.additional_notes}
          onChange={(value) =>
            onUpdateAiTraining("additional_notes", value)
          }
          large
        />
      </div>
    </section>
  );
}
