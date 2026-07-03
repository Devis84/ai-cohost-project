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
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="text-5xl">🙏</div>
          <h1 className="text-3xl font-black text-neutral-900">
            Thank You!
          </h1>
          <p className="text-lg text-neutral-600">
            Your stay has ended
          </p>
        </div>

        {/* Message */}
        <div className="bg-neutral-50 rounded-xl p-4 space-y-2">
          <p className="text-neutral-800">
            We hope you had a wonderful time{" "}
            {propertyName && `at ${propertyName}`}.
          </p>

          {guestName && (
            <p className="text-neutral-700">
              Thank you for visiting, {guestName}!
            </p>
          )}

          {checkoutDisplay && (
            <p className="text-sm text-neutral-600">
              Checked out: {checkoutDisplay}
            </p>
          )}
        </div>

        {/* Access Ended */}
        <div className="border-l-4 border-amber-400 bg-amber-50 p-4 rounded-lg">
          <p className="text-sm text-amber-900">
            <span className="font-semibold">Your access has ended.</span>
            {" "}
            Access to your stay information and AI concierge is no longer
            available.
          </p>
        </div>

        {/* Feedback Prompt */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-neutral-700">
            Would you mind sharing your feedback?
          </p>
          <div className="flex gap-2 justify-center">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              onClick={() => {
                // Future: redirect to review form or external review site
                window.location.href =
                  "mailto:" +
                  (contactInfo?.email || "info@example.com") +
                  "?subject=Stay Feedback";
              }}
            >
              Leave Feedback
            </button>
            <button
              className="px-4 py-2 bg-neutral-200 text-neutral-800 rounded-lg font-medium hover:bg-neutral-300 transition-colors"
              onClick={() => {
                // Try to go back, fall back to home
                try {
                  if (typeof window !== "undefined" && window.history.length > 1) {
                    window.history.back();
                  } else {
                    window.location.href = "/";
                  }
                } catch (e) {
                  window.location.href = "/";
                }
              }}
            >
              Done
            </button>
          </div>
        </div>

        {/* Contact Info */}
        {contactInfo && (
          <div className="text-center text-xs text-neutral-500 space-y-1">
            <p>Questions?</p>
            {contactInfo.email && (
              <p>
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {contactInfo.email}
                </a>
              </p>
            )}
            {contactInfo.phone && (
              <p>
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="text-blue-600 hover:underline"
                >
                  {contactInfo.phone}
                </a>
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-neutral-500 pt-4 border-t border-neutral-200">
          <p>Safe travels!</p>
        </div>
      </div>
    </div>
  );
}
