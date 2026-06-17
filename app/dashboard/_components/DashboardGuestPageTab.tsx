"use client";

import {
  FieldLabel,
  SectionHeader,
  TextArea,
} from "./DashboardUi";

import { splitHighlights } from "../_lib/dashboard-utils";

import type {
  GuestPageContent,
  KnowledgeBase,
} from "../_types/dashboard";

export function DashboardGuestPageTab({
  propertyName,
  city,
  country,
  checkin,
  checkout,
  guestPageUrl,
  knowledgeBase,
  isMalteseMaisonette,
  malteseMaisonetteHeroImage,
  onCopyGuestUrl,
  onApplyDefaultHeroImage,
  onApplyPremiumGuestCopy,
  onApplyMalteseMaisonetteGuestCopy,
  onUpdateGuestPage,
}: {
  propertyName: string;
  city: string;
  country: string;
  checkin: string;
  checkout: string;
  guestPageUrl: string;
  knowledgeBase: KnowledgeBase;
  isMalteseMaisonette: boolean;
  malteseMaisonetteHeroImage: string;
  onCopyGuestUrl: () => void;
  onApplyDefaultHeroImage: () => void;
  onApplyPremiumGuestCopy: () => void;
  onApplyMalteseMaisonetteGuestCopy: () => void;
  onUpdateGuestPage: (
    field: keyof GuestPageContent,
    value: string
  ) => void;
}) {
  const guestPage = knowledgeBase.guest_page;

  const heroPreviewImage = (() => {
    if (guestPage.hero_image_url.trim()) {
      return guestPage.hero_image_url.trim();
    }

    if (isMalteseMaisonette) {
      return malteseMaisonetteHeroImage;
    }

    return "";
  })();

  const heroPreviewTitle =
    guestPage.hero_title.trim() ||
    `Welcome to ${propertyName || "Your Stay"}`;

  const heroPreviewIntro =
    guestPage.hero_intro.trim() ||
    "A comfortable private stay with everything you need in one place.";

  const aboutPreviewTitle =
    guestPage.about_title.trim() || "About this stay";

  const aboutPreviewIntro =
    guestPage.about_intro.trim() ||
    "A private stay designed to make your visit simple, comfortable and easy to manage.";

  const aboutPreviewDescription =
    guestPage.about_description.trim() ||
    knowledgeBase.welcome_book.description.trim() ||
    "Add a warm, guest-friendly description of the apartment here.";

  const aboutPreviewHighlights = (() => {
    const items = splitHighlights(
      guestPage.about_highlights
    );

    if (items.length > 0) {
      return items;
    }

    return [
      "Private guest space",
      "Useful stay information",
      "AI Concierge support",
      "Local tips and essentials",
    ];
  })();

  return (
    <>
      <section className="bg-black text-white rounded-[32px] p-7 shadow-xl border border-black">
        <SectionHeader
          icon="✨"
          title="Guest Page Experience"
          description="Control the first impression guests see when they scan your QR/NFC link. Use a short emotional intro, a strong hero image and a clear About This Stay section."
        />

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/10 border border-white/10 rounded-3xl p-5">
            <div className="text-white/50 text-sm mb-2">
              Guest page URL
            </div>

            <div className="font-bold break-all">
              {guestPageUrl ||
                "Select a property first"}
            </div>
          </div>

          <div className="bg-white/10 border border-white/10 rounded-3xl p-5">
            <div className="text-white/50 text-sm mb-2">
              Style goal
            </div>

            <div className="font-bold">
              Premium, mobile-first, emotional and credible
            </div>
          </div>
        </div>

        {guestPageUrl && (
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onCopyGuestUrl}
              className="inline-flex bg-white text-black px-5 py-3 rounded-2xl font-semibold"
            >
              Copy Guest URL
            </button>

            <a
              href={guestPageUrl}
              target="_blank"
              className="inline-flex bg-white/10 border border-white/10 text-white px-5 py-3 rounded-2xl font-semibold hover:bg-white/15"
            >
              Open Guest Page
            </a>

            <a
              href="/dashboard/qr"
              className="inline-flex bg-white/10 border border-white/10 text-white px-5 py-3 rounded-2xl font-semibold hover:bg-white/15"
            >
              Manage QR/NFC
            </a>
          </div>
        )}
      </section>

      <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
        <div className="mb-6 grid md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={onApplyPremiumGuestCopy}
            className="bg-black text-white rounded-2xl px-5 py-4 font-semibold hover:opacity-90 transition"
          >
            ✨ Generate Premium Copy
          </button>

          <button
            type="button"
            onClick={onApplyMalteseMaisonetteGuestCopy}
            className="bg-[#f4f1eb] text-black border border-black/5 rounded-2xl px-5 py-4 font-semibold hover:bg-[#ebe6dd] transition"
          >
            🏡 Use Maltese Maisonette Copy
          </button>

          <button
            type="button"
            onClick={onApplyDefaultHeroImage}
            className="bg-white text-black border border-gray-200 rounded-2xl px-5 py-4 font-semibold hover:bg-gray-50 transition"
          >
            🖼️ Apply Default Image
          </button>
        </div>

        <div className="mb-8 bg-amber-50 border border-amber-100 rounded-3xl p-5">
          <div className="font-bold text-amber-950 mb-2">
            Guest page setup
          </div>

          <p className="text-sm text-amber-900/70 leading-relaxed">
            Use these quick actions to create a strong first draft,
            then review the text and save. The guest page URL can be
            used for QR codes, NFC tags, printed welcome cards and
            guest messages.
          </p>

          <div className="mt-3 text-xs text-amber-900/60 break-all">
            Recommended local hero path: {malteseMaisonetteHeroImage}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_0.95fr] gap-8">
          <div>
            <SectionHeader
              icon="🖼️"
              title="Hero Section"
              description="This is the top section of the guest page. Keep it short, emotional and visual. Do not paste the full Airbnb description here."
            />

            <div className="grid md:grid-cols-2 gap-4 mb-5">
              <div>
                <FieldLabel
                  title="Hero title"
                  description="Main headline shown on the guest page. Usually the property name or a warmer welcome title."
                />

                <input
                  className="w-full border border-gray-200 rounded-2xl p-4"
                  placeholder="Example: Welcome to Maltese Maisonette"
                  value={knowledgeBase.guest_page.hero_title}
                  onChange={(event) =>
                    onUpdateGuestPage(
                      "hero_title",
                      event.target.value
                    )
                  }
                />
              </div>

              <div>
                <FieldLabel
                  title="Hero image URL"
                  description="Use a public image URL or a local image path such as /guest-images/maltese-maisonette-hero-bedroom.jpg"
                />

                <input
                  className="w-full border border-gray-200 rounded-2xl p-4"
                  placeholder={malteseMaisonetteHeroImage}
                  value={knowledgeBase.guest_page.hero_image_url}
                  onChange={(event) =>
                    onUpdateGuestPage(
                      "hero_image_url",
                      event.target.value
                    )
                  }
                />
              </div>
            </div>

            <TextArea
              placeholder="Hero intro. Short emotional intro shown in the hero. Keep this around 1–2 lines."
              value={knowledgeBase.guest_page.hero_intro}
              onChange={(value) =>
                onUpdateGuestPage("hero_intro", value)
              }
            />

            <div className="border-t border-gray-200 pt-6 mt-8">
              <SectionHeader
                icon="🏡"
                title="About This Stay"
                description="This section sits below the hero and gives guests a richer, more complete description of the apartment without overloading the first screen."
              />

              <div className="mb-5">
                <FieldLabel
                  title="Section title"
                  description="Usually 'About this stay', but you can customize it."
                />

                <input
                  className="w-full border border-gray-200 rounded-2xl p-4"
                  placeholder="About this stay"
                  value={knowledgeBase.guest_page.about_title}
                  onChange={(event) =>
                    onUpdateGuestPage(
                      "about_title",
                      event.target.value
                    )
                  }
                />
              </div>

              <TextArea
                placeholder="About intro. Short premium intro, 1–2 sentences. This should feel warm and emotional."
                value={knowledgeBase.guest_page.about_intro}
                onChange={(value) =>
                  onUpdateGuestPage("about_intro", value)
                }
              />

              <TextArea
                placeholder="About description. Add the full guest-friendly apartment description. This can include bedroom, kitchen, WiFi, location, nearby promenade, cafés, transport and other practical details."
                value={
                  knowledgeBase.guest_page.about_description
                }
                onChange={(value) =>
                  onUpdateGuestPage(
                    "about_description",
                    value
                  )
                }
                large
              />

              <TextArea
                placeholder="Highlights. Add one highlight per line. These will be shown as short premium bullet points on the guest page."
                value={
                  knowledgeBase.guest_page.about_highlights
                }
                onChange={(value) =>
                  onUpdateGuestPage(
                    "about_highlights",
                    value
                  )
                }
              />

              <div className="mt-6 bg-[#f4f1eb] rounded-[28px] p-5 border border-black/5">
                <div className="text-xs uppercase tracking-[0.25em] text-gray-400 mb-3">
                  Suggested highlights
                </div>

                <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-600">
                  <div>✓ Private one-bedroom maisonette</div>
                  <div>✓ Central Sliema location</div>
                  <div>✓ High-speed WiFi and desk</div>
                  <div>✓ Kitchen and washing machine</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-8 h-fit">
            <div className="rounded-[32px] overflow-hidden bg-black text-white shadow-2xl border border-black">
              <div className="relative min-h-[360px]">
                {heroPreviewImage ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${heroPreviewImage})`,
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-black" />
                )}

                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/10" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/10" />

                <div className="relative p-6 min-h-[360px] flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-3 py-2 text-xs text-white/90 mb-4 backdrop-blur-md">
                      <span>✨</span>
                      <span>Live Preview</span>
                    </div>

                    <div className="uppercase tracking-[0.25em] text-[10px] text-white/60 mb-3">
                      AI CO-HOST EXPERIENCE
                    </div>

                    <h3 className="text-3xl font-black leading-[0.95] mb-4 drop-shadow-xl">
                      {heroPreviewTitle}
                    </h3>

                    <p className="text-white/85 text-sm leading-relaxed drop-shadow-xl">
                      {heroPreviewIntro}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-6">
                    {city && (
                      <div className="bg-white/15 border border-white/20 rounded-full px-3 py-2 text-xs backdrop-blur-md">
                        📍 {city}
                        {country ? `, ${country}` : ""}
                      </div>
                    )}

                    {checkin && (
                      <div className="bg-white/15 border border-white/20 rounded-full px-3 py-2 text-xs backdrop-blur-md">
                        🔑 Check-in: {checkin}
                      </div>
                    )}

                    {checkout && (
                      <div className="bg-white/15 border border-white/20 rounded-full px-3 py-2 text-xs backdrop-blur-md">
                        🚪 Check-out: {checkout}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white text-black p-6">
                <div className="uppercase tracking-[0.25em] text-[10px] text-gray-400 mb-3">
                  THE APARTMENT
                </div>

                <h3 className="text-2xl font-black mb-3">
                  {aboutPreviewTitle}
                </h3>

                <p className="text-gray-800 leading-relaxed mb-4">
                  {aboutPreviewIntro}
                </p>

                <p className="text-gray-500 text-sm leading-relaxed line-clamp-5 whitespace-pre-line">
                  {aboutPreviewDescription}
                </p>

                <div className="mt-5 bg-[#f4f1eb] rounded-3xl p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-gray-400 mb-3">
                    Highlights
                  </div>

                  <div className="space-y-2">
                    {aboutPreviewHighlights
                      .slice(0, 4)
                      .map((item) => (
                        <div
                          key={item}
                          className="bg-white rounded-2xl px-3 py-3 text-sm font-bold flex items-center gap-2"
                        >
                          <span>✓</span>
                          <span>{item}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-5">
                  <button
                    type="button"
                    onClick={onCopyGuestUrl}
                    className="bg-black text-white rounded-2xl px-4 py-3 text-sm font-semibold"
                  >
                    Copy URL
                  </button>

                  {guestPageUrl ? (
                    <a
                      href={guestPageUrl}
                      target="_blank"
                      className="bg-gray-100 text-black rounded-2xl px-4 py-3 text-sm font-semibold text-center"
                    >
                      Open Page
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="bg-gray-100 text-gray-400 rounded-2xl px-4 py-3 text-sm font-semibold"
                    >
                      Open Page
                    </button>
                  )}
                </div>

                <div className="mt-4 text-xs text-gray-400 break-all">
                  {guestPageUrl ||
                    "Guest page URL not available yet."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}