import { useCallback } from "react";
import type {
  AiTraining,
  ExtraServices,
  GuestPageContent,
  GuestSupport,
  KnowledgeBase,
  LocalGuide,
  WelcomeBook,
} from "../_types/dashboard";

interface UseKnowledgeBaseActionsParams {
  setKnowledgeBase: (
    updater:
      | KnowledgeBase
      | ((current: KnowledgeBase) => KnowledgeBase)
  ) => void;
}

interface UseKnowledgeBaseActionsReturn {
  updateGuestPage: (
    field: keyof GuestPageContent,
    value: string
  ) => void;
  updateGuestSupport: (
    field: keyof GuestSupport,
    value: string | boolean
  ) => void;
  updateWelcomeBook: (
    field: keyof WelcomeBook,
    value: string
  ) => void;
  updateExtraServices: (
    field: keyof ExtraServices,
    value: string | boolean
  ) => void;
  updateLocalGuide: (
    field: keyof LocalGuide,
    value: string
  ) => void;
  updateAiTraining: (
    field: keyof AiTraining,
    value: string
  ) => void;
}

export function useKnowledgeBaseActions(
  params: UseKnowledgeBaseActionsParams
): UseKnowledgeBaseActionsReturn {
  const { setKnowledgeBase } = params;

  const updateGuestPage = useCallback(
    (field: keyof GuestPageContent, value: string) => {
      setKnowledgeBase((current) => ({
        ...current,
        guest_page: {
          ...current.guest_page,
          [field]: value,
        },
      }));
    },
    [setKnowledgeBase]
  );

  const updateGuestSupport = useCallback(
    (field: keyof GuestSupport, value: string | boolean) => {
      setKnowledgeBase((current) => ({
        ...current,
        guest_support: {
          ...current.guest_support,
          [field]: value,
        },
      }));
    },
    [setKnowledgeBase]
  );

  const updateWelcomeBook = useCallback(
    (field: keyof WelcomeBook, value: string) => {
      setKnowledgeBase((current) => ({
        ...current,
        welcome_book: {
          ...current.welcome_book,
          [field]: value,
        },
      }));
    },
    [setKnowledgeBase]
  );

  const updateExtraServices = useCallback(
    (field: keyof ExtraServices, value: string | boolean) => {
      setKnowledgeBase((current) => ({
        ...current,
        extra_services: {
          ...current.extra_services,
          [field]: value,
        },
      }));
    },
    [setKnowledgeBase]
  );

  const updateLocalGuide = useCallback(
    (field: keyof LocalGuide, value: string) => {
      setKnowledgeBase((current) => ({
        ...current,
        local_guide: {
          ...current.local_guide,
          [field]: value,
        },
      }));
    },
    [setKnowledgeBase]
  );

  const updateAiTraining = useCallback(
    (field: keyof AiTraining, value: string) => {
      setKnowledgeBase((current) => ({
        ...current,
        ai_training: {
          ...current.ai_training,
          [field]: value,
        },
      }));
    },
    [setKnowledgeBase]
  );

  return {
    updateGuestPage,
    updateGuestSupport,
    updateWelcomeBook,
    updateExtraServices,
    updateLocalGuide,
    updateAiTraining,
  };
}
