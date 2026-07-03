import { useCallback } from "react";
import type { KnowledgeBase, GuestPageContent } from "../_types/dashboard";
import { malteseMaisonetteHeroImage } from "../_constants/dashboardConstants";

interface UseDashboardTemplatesParams {
  propertyName: string;
  city: string;
  isMalteseMaisonette: boolean;
  updateGuestPage: (
    field: keyof GuestPageContent,
    value: string
  ) => void;
  setKnowledgeBase: (
    updater:
      | KnowledgeBase
      | ((current: KnowledgeBase) => KnowledgeBase)
  ) => void;
}

interface UseDashboardTemplatesReturn {
  applyDefaultHeroImage: () => void;
  applyPremiumGuestCopy: () => void;
  applyMalteseMaisonetteGuestCopy: () => void;
  applyExtraServicesTemplate: () => void;
}

export function useDashboardTemplates(
  params: UseDashboardTemplatesParams
): UseDashboardTemplatesReturn {
  const {
    propertyName,
    city,
    isMalteseMaisonette,
    updateGuestPage,
    setKnowledgeBase,
  } = params;

  const applyDefaultHeroImage = useCallback(() => {
    updateGuestPage("hero_image_url", malteseMaisonetteHeroImage);
    alert(
      "Default hero image applied. Review and save when ready."
    );
  }, [updateGuestPage]);

  const applyPremiumGuestCopy = useCallback(() => {
    const cleanName = propertyName.trim() || "Your Stay";
    const cleanCity = city.trim() || "the local area";

    setKnowledgeBase((current) => ({
      ...current,
      guest_page: {
        ...current.guest_page,
        hero_title: `Welcome to ${cleanName}`,
        hero_intro: `A warm, comfortable and thoughtfully prepared stay in ${cleanCity}, designed to make your visit simple, relaxed and memorable.`,
        hero_image_url:
          current.guest_page.hero_image_url ||
          (isMalteseMaisonette
            ? malteseMaisonetteHeroImage
            : ""),
        about_title: "About this stay",
        about_intro:
          "A private and comfortable space designed to help you feel at home from the moment you arrive.",
        about_description: `This property offers a practical and welcoming base for your stay in ${cleanCity}. Inside, guests will find the essential comforts needed for a smooth visit, including a comfortable sleeping area, useful home amenities, WiFi, practical arrival information and local tips available through the digital guest page. The space is designed to be easy to use, easy to settle into and convenient for guests who want a simple, independent and well-supported stay.`,
        about_highlights:
          "Private guest space\nComfortable stay experience\nWiFi and practical essentials\nLocal tips and AI Concierge support",
      },
    }));

    alert(
      "Premium guest page copy applied. Review and save when ready."
    );
  }, [propertyName, city, isMalteseMaisonette, setKnowledgeBase]);

  const applyMalteseMaisonetteGuestCopy = useCallback(() => {
    setKnowledgeBase((current) => ({
      ...current,
      guest_page: {
        ...current.guest_page,
        hero_title: "Welcome to Maltese Maisonette",
        hero_intro:
          "A cozy Maltese maisonette in central Sliema, designed for a simple, comfortable and authentic stay by the sea.",
        hero_image_url: malteseMaisonetteHeroImage,
        about_title: "About this stay",
        about_intro:
          "This private one-bedroom maisonette gives you the feeling of a traditional Maltese home, with the comfort and independence of having the entire place to yourself.",
        about_description:
          "Inside, you'll find a queen-size bedroom with A/C, a living area with sofa, a fully equipped kitchen, a bathroom with shower and washing machine, high-speed WiFi, a desk for work or study, and a small outdoor space. The apartment is set on a quiet Maltese street in central Sliema, close to the promenade, cafés, shops, public transport, Balluta Bay and St Julian's nightlife. It is ideal for guests who want a central location, practical comfort and an authentic local base while staying in Malta.",
        about_highlights:
          "Private one-bedroom maisonette\nCentral Sliema location\n100m from the promenade\nHigh-speed WiFi and desk\nKitchen and washing machine\nA/C in the bedroom",
      },
    }));

    alert(
      "Maltese Maisonette guest page copy applied. Review and save when ready."
    );
  }, [setKnowledgeBase]);

  const applyExtraServicesTemplate = useCallback(() => {
    setKnowledgeBase((current) => ({
      ...current,
      extra_services: {
        ...current.extra_services,
        title: "Extra Services",
        intro:
          "Enhance your stay with selected local services and trusted partner recommendations. Availability may vary, so please contact the host before booking.",
        services:
          "Airport transfer — Available on request, subject to availability and price confirmation\nScooter rental — Local partner options can be shared on request\nCar rental — Recommended providers available nearby\nBoat trips & excursions — Seasonal tours and local experiences can be recommended\nMassage or wellness services — Available with advance booking when possible\nLate checkout — Subject to availability and host approval\nLuggage storage — Ask the host for available options",
        host_note:
          "Internal note: add partner contacts, prices, commissions, availability rules and services that require manual host approval.",
      },
    }));

    alert(
      "Extra Services template applied. Review, enable and save when ready."
    );
  }, [setKnowledgeBase]);

  return {
    applyDefaultHeroImage,
    applyPremiumGuestCopy,
    applyMalteseMaisonetteGuestCopy,
    applyExtraServicesTemplate,
  };
}
