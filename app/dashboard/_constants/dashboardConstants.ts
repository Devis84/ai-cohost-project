export const malteseMaisonetteHeroImage =
  "/guest-images/maltese-maisonette-hero-bedroom.jpg";

export const selectedPropertyStorageKey =
  "ai_cohost_selected_property_slug";

export const defaultDashboardAccess = {
  email: null,
  role: "admin",
  isAdmin: true,
  isPartner: false,
  isViewer: false,
  isActive: true,
  canCreateProperty: true,
  canDeleteProperty: true,
  reason: "frontend_default_admin",
} as const;
