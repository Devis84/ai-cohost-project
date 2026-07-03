import type { DashboardAccess as DashboardAccessType } from "../_types/dashboard";

export type DashboardAccess = DashboardAccessType;

export function normalizeDashboardAccess(
  data: any
): DashboardAccess {
  return {
    email:
      typeof data?.email === "string" ? data.email : null,
    role:
      typeof data?.role === "string" ? data.role : "admin",
    isAdmin:
      typeof data?.isAdmin === "boolean"
        ? data.isAdmin
        : true,
    isPartner:
      typeof data?.isPartner === "boolean"
        ? data.isPartner
        : false,
    isViewer:
      typeof data?.isViewer === "boolean"
        ? data.isViewer
        : false,
    isActive:
      typeof data?.isActive === "boolean"
        ? data.isActive
        : true,
    canCreateProperty:
      typeof data?.canCreateProperty === "boolean"
        ? data.canCreateProperty
        : true,
    canDeleteProperty:
      typeof data?.canDeleteProperty === "boolean"
        ? data.canDeleteProperty
        : true,
    reason:
      typeof data?.reason === "string" ? data.reason : "",
  };
}
