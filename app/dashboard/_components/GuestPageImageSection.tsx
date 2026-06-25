"use client";

import PropertyHeroImageUploader from "./PropertyHeroImageUploader";

import type { KnowledgeBase } from "../_types/dashboard";

type GuestPageKnowledgeBase = KnowledgeBase & {
  guest_page?: {
    hero_image_url?: string | null;
  };
};

type GuestPageImageSectionProps = {
  selectedSlug: string;
  propertyName: string;
  knowledgeBase: KnowledgeBase;
  accessRole?: string;
};

export default function GuestPageImageSection({
  selectedSlug,
  propertyName,
  knowledgeBase,
  accessRole = "admin",
}: GuestPageImageSectionProps) {
  const knowledgeBaseWithGuestPage =
    knowledgeBase as GuestPageKnowledgeBase;

  const currentImageUrl =
    knowledgeBaseWithGuestPage.guest_page?.hero_image_url || "";

  const canUpload =
    Boolean(selectedSlug) && accessRole !== "viewer";

  return (
    <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
      <div className="mb-5">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
          Guest Page Visuals
        </div>

        <h2 className="mt-2 text-2xl font-bold text-gray-950">
          Welcome page image
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-500">
          Upload the main photo used on the guest welcome page. This is the
          image guests will see when they open the QR/NFC guest page for this
          property.
        </p>
      </div>

      {!selectedSlug ? (
        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 text-sm text-amber-900">
          Select or create a property before uploading a guest page image.
        </div>
      ) : (
        <PropertyHeroImageUploader
          propertySlug={selectedSlug}
          propertyName={propertyName}
          currentImageUrl={currentImageUrl}
          disabled={!canUpload}
        />
      )}
    </section>
  );
}