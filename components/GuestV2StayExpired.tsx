"use client";

import React from "react";

interface GuestV2StayExpiredProps {
  propertyName?: string;
  checkoutDate?: Date | string;
  guestName?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
  };
}

/**
 * Professional thank you page shown after stay expires
 *
 * Displayed when:
 * - Guest stay has ended
 * - Grace period has passed
 * - All access is revoked
 *
 * Includes:
 * - Professional thank you message
 * - Option to write review
 * - Contact information
 * - Feedback collection
 */
export function GuestV2StayExpired({
  propertyName = "Your stay",
  checkoutDate,
  guestName,
  contactInfo,
}: GuestV2StayExpiredProps) {
  const checkoutDisplay = checkoutDate
    ? new Date(checkoutDate).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6f1e8] to-[#f0e9dd] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[2.5rem] shadow-lg ring-1 ring-black/5 overflow-hidden">
          {/* Gradient Header */}
          <div className="relative h-48 bg-gradient-to-br from-[#d8c5a7] via-[#efe2cf] to-[#9eb6b8]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.7),transparent_35%),linear-gradient(to_top,rgba(0,0,0,0.3),transparent_60%)]" />

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-3">
              <div className="text-6xl drop-shadow">🙏</div>
              <h1 className="text-4xl font-black text-white drop-shadow-lg">
                Thank You!
              </h1>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Message */}
            <div className="space-y-2 text-center">
              <p className="text-lg text-black/80">
                We hope you had a wonderful time{" "}
                {propertyName && <span className="font-semibold">{propertyName}</span>}.
              </p>

              {guestName && (
                <p className="text-base text-black/70">
                  Thank you for visiting, <span className="font-semibold">{guestName}</span>!
                </p>
              )}

              {checkoutDisplay && (
                <p className="text-sm text-black/50 pt-1">
                  Checked out: {checkoutDisplay}
                </p>
              )}
            </div>

            {/* Access Ended Alert */}
            <div className="border-l-4 border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-xl">
              <p className="text-sm text-amber-900 leading-relaxed">
                <span className="font-black">Your access has ended.</span>
                {" "}
                Access to your stay information and AI concierge is no longer available.
              </p>
            </div>

            {/* Feedback Section */}
            <div className="bg-black/5 rounded-xl p-5 space-y-3">
              <p className="text-sm font-semibold text-black">
                Share your feedback
              </p>
              <p className="text-xs text-black/60">
                Help us improve the stay experience for future guests.
              </p>

              <div className="flex gap-2">
                <button
                  className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg font-semibold text-sm transition active:scale-[0.98] shadow-md hover:bg-black/90"
                  onClick={() => {
                    // Future: redirect to review form or external review site
                    if (contactInfo?.email) {
                      window.location.href = `mailto:${contactInfo.email}?subject=Stay Feedback`;
                    }
                  }}
                >
                  Leave Feedback
                </button>
                <button
                  className="flex-1 px-4 py-2.5 bg-white border border-black/10 text-black rounded-lg font-semibold text-sm transition active:scale-[0.98] hover:bg-black/5"
                  onClick={() => {
                    // Try to go back, fall back to home
                    try {
                      if (typeof window !== "undefined" && window.history.length > 1) {
                        window.history.back();
                      } else {
                        window.location.href = "/";
                      }
                    } catch {
                      window.location.href = "/";
                    }
                  }}
                >
                  Done
                </button>
              </div>
            </div>

            {/* Contact Info */}
            {contactInfo && (contactInfo.email || contactInfo.phone) && (
              <div className="text-center space-y-2 pt-2 border-t border-black/5">
                <p className="text-xs font-semibold text-black/50">
                  Questions?
                </p>
                <div className="flex flex-col gap-2">
                  {contactInfo.email && (
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="text-xs text-black/60 hover:text-black transition"
                    >
                      📧 {contactInfo.email}
                    </a>
                  )}
                  {contactInfo.phone && (
                    <a
                      href={`tel:${contactInfo.phone}`}
                      className="text-xs text-black/60 hover:text-black transition"
                    >
                      📞 {contactInfo.phone}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-xs text-black/50 pt-2 border-t border-black/5">
              <p>Safe travels! ✈️</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
