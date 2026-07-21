import "server-only";

import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase/supabase-server";

export type AppUserRole = "admin" | "partner" | "viewer";

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: AppUserRole;
  is_active: boolean;
  notes: string | null;
};

export type UserPropertyAccess = {
  id: string;
  user_id: string;
  property_id: string;
  access_role: string;
  can_view: boolean;
  can_edit: boolean;
  can_create_property: boolean;
  can_delete_property: boolean;
  is_active: boolean;
  expires_at: string | null;
};

export type AccessControlledProperty = {
  id?: string;
  slug?: string | null;
  property_name?: string | null;
  [key: string]: unknown;
};

export type PartnerAccessContext = {
  email: string | null;
  profile: UserProfile | null;
  role: AppUserRole;
  isAdmin: boolean;
  isPartner: boolean;
  isViewer: boolean;
  isActive: boolean;
  canCreateProperty: boolean;
  canDeleteProperty: boolean;
  reason: string;
};

export type AuditLogInput = {
  request?: Request;
  accessContext?: PartnerAccessContext;
  action: string;
  entityType?: string;
  entityId?: string;
  propertyId?: string | null;
  propertySlug?: string | null;
  metadata?: Record<string, unknown>;
};

const adminRole: AppUserRole = "admin";
const partnerRole: AppUserRole = "partner";
const viewerRole: AppUserRole = "viewer";

function getEnvAdminEmails() {
  const raw =
    process.env.AI_COHOST_ADMIN_EMAILS ||
    process.env.ADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
    "";

  return raw
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

export function normalizeEmail(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function parseCookieHeader(cookieHeader: string | null) {
  const cookies = new Map<string, string>();

  if (!cookieHeader) {
    return cookies;
  }

  const parts = cookieHeader.split(";");

  for (const part of parts) {
    const [rawKey, ...rawValueParts] = part.trim().split("=");

    if (!rawKey) {
      continue;
    }

    cookies.set(
      rawKey,
      decodeURIComponent(rawValueParts.join("=") || "")
    );
  }

  return cookies;
}

function hasAuthenticatedSession(request?: Request) {
  if (!request) {
    return false;
  }

  const cookies = parseCookieHeader(request.headers.get("cookie"));
  return cookies.get("ai_cohost_auth") === "true";
}

export function getRequestUserEmail(request?: Request) {
  if (!request) {
    return null;
  }

  const cookies = parseCookieHeader(request.headers.get("cookie"));

  if (cookies.get("ai_cohost_auth") !== "true") {
    return null;
  }

  const cookieEmail =
    cookies.get("ai_cohost_user_email") ||
    cookies.get("app_user_email") ||
    cookies.get("partner_user_email") ||
    "";

  if (cookieEmail) {
    return normalizeEmail(cookieEmail);
  }

  return null;
}

function buildAdminContext(
  email: string | null,
  profile: UserProfile | null,
  reason: string
): PartnerAccessContext {
  return {
    email,
    profile,
    role: adminRole,
    isAdmin: true,
    isPartner: false,
    isViewer: false,
    isActive: true,
    canCreateProperty: true,
    canDeleteProperty: true,
    reason,
  };
}

function buildInactiveContext(
  email: string | null,
  profile: UserProfile | null,
  reason: string
): PartnerAccessContext {
  return {
    email,
    profile,
    role: viewerRole,
    isAdmin: false,
    isPartner: false,
    isViewer: true,
    isActive: false,
    canCreateProperty: false,
    canDeleteProperty: false,
    reason,
  };
}

function buildProfileContext(
  profile: UserProfile
): PartnerAccessContext {
  const role = profile.role || viewerRole;
  const isAdmin = role === adminRole;
  const isPartner = role === partnerRole;
  const isViewer = role === viewerRole;

  return {
    email: normalizeEmail(profile.email),
    profile,
    role,
    isAdmin,
    isPartner,
    isViewer,
    isActive: profile.is_active,
    canCreateProperty: isAdmin,
    canDeleteProperty: isAdmin,
    reason: "profile_loaded",
  };
}

export async function getPartnerAccessContext(
  request?: Request
): Promise<PartnerAccessContext> {
  if (!request) {
    return buildInactiveContext(
      null,
      null,
      "unauthenticated_request"
    );
  }

  if (!hasAuthenticatedSession(request)) {
    return buildInactiveContext(
      null,
      null,
      "missing_auth_session"
    );
  }

  const email = getRequestUserEmail(request);

  if (!email) {
    return buildInactiveContext(
      null,
      null,
      "missing_authenticated_email"
    );
  }

  const envAdminEmails = getEnvAdminEmails();

  if (envAdminEmails.includes(email)) {
    return buildAdminContext(
      email,
      null,
      "email_matches_admin_environment_list"
    );
  }

  const { data, error } = await supabaseServer
    .from("user_profiles")
    .select("id, email, full_name, role, is_active, notes")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("PARTNER ACCESS PROFILE ERROR:", error);

    return buildInactiveContext(
      email,
      null,
      "profile_lookup_failed"
    );
  }

  if (!data) {
    return buildInactiveContext(
      email,
      null,
      "profile_not_found"
    );
  }

  const profile = data as UserProfile;

  if (!profile.is_active) {
    return buildInactiveContext(
      email,
      profile,
      "profile_inactive"
    );
  }

  return buildProfileContext(profile);
}

export async function getUserPropertyAccessRows(
  accessContext: PartnerAccessContext
): Promise<UserPropertyAccess[]> {
  if (accessContext.isAdmin || !accessContext.profile?.id) {
    return [];
  }

  const { data, error } = await supabaseServer
    .from("user_property_access")
    .select(
      "id, user_id, property_id, access_role, can_view, can_edit, can_create_property, can_delete_property, is_active, expires_at"
    )
    .eq("user_id", accessContext.profile.id)
    .eq("is_active", true);

  if (error) {
    console.error("USER PROPERTY ACCESS ERROR:", error);
    return [];
  }

  const now = Date.now();

  return ((data || []) as UserPropertyAccess[]).filter((row) => {
    if (!row.expires_at) {
      return true;
    }

    return new Date(row.expires_at).getTime() > now;
  });
}

export async function getVisiblePropertyIds(
  accessContext: PartnerAccessContext
) {
  if (accessContext.isAdmin) {
    return null;
  }

  const rows = await getUserPropertyAccessRows(accessContext);

  return rows
    .filter((row) => row.can_view)
    .map((row) => row.property_id);
}

export async function filterPropertiesForAccess<
  T extends AccessControlledProperty,
>(
  properties: T[],
  accessContext: PartnerAccessContext
): Promise<T[]> {
  if (accessContext.isAdmin) {
    return properties;
  }

  if (!accessContext.isActive || !accessContext.profile?.id) {
    return [];
  }

  const visibleIds = await getVisiblePropertyIds(accessContext);

  if (!visibleIds || visibleIds.length === 0) {
    return [];
  }

  const visibleSet = new Set(visibleIds);

  return properties.filter((property) => {
    if (!property.id) {
      return false;
    }

    return visibleSet.has(property.id);
  });
}

export async function canViewProperty(
  property: AccessControlledProperty,
  accessContext: PartnerAccessContext
) {
  if (accessContext.isAdmin) {
    return true;
  }

  if (!accessContext.isActive || !accessContext.profile?.id || !property.id) {
    return false;
  }

  const rows = await getUserPropertyAccessRows(accessContext);

  return rows.some(
    (row) => row.property_id === property.id && row.can_view
  );
}

export async function canEditProperty(
  property: AccessControlledProperty,
  accessContext: PartnerAccessContext
) {
  if (accessContext.isAdmin) {
    return true;
  }

  if (!accessContext.isActive || !accessContext.profile?.id || !property.id) {
    return false;
  }

  const rows = await getUserPropertyAccessRows(accessContext);

  return rows.some(
    (row) =>
      row.property_id === property.id &&
      row.can_view &&
      row.can_edit
  );
}

export async function canDeleteProperty(
  property: AccessControlledProperty,
  accessContext: PartnerAccessContext
) {
  if (accessContext.isAdmin) {
    return true;
  }

  if (!accessContext.isActive || !accessContext.profile?.id || !property.id) {
    return false;
  }

  const rows = await getUserPropertyAccessRows(accessContext);

  return rows.some(
    (row) =>
      row.property_id === property.id &&
      row.can_view &&
      row.can_delete_property
  );
}

export function canCreateProperty(
  accessContext: PartnerAccessContext
) {
  return Boolean(
    accessContext.isActive &&
      accessContext.isAdmin &&
      accessContext.canCreateProperty
  );
}

export function buildAccessMetadata(
  accessContext: PartnerAccessContext
) {
  return {
    email: accessContext.email,
    role: accessContext.role,
    isAdmin: accessContext.isAdmin,
    isPartner: accessContext.isPartner,
    isViewer: accessContext.isViewer,
    isActive: accessContext.isActive,
    canCreateProperty: accessContext.canCreateProperty,
    canDeleteProperty: accessContext.canDeleteProperty,
    reason: accessContext.reason,
  };
}

export function getClientIp(request?: Request) {
  if (!request) {
    return null;
  }

  return (
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    null
  );
}

export function getUserAgent(request?: Request) {
  if (!request) {
    return null;
  }

  return request.headers.get("user-agent");
}

export async function writeAuditLog(input: AuditLogInput) {
  try {
    const requestEmail = getRequestUserEmail(input.request);
    const userEmail =
      input.accessContext?.email || requestEmail || null;

    const userId = input.accessContext?.profile?.id || null;

    const { error } = await supabaseServer
      .from("audit_logs")
      .insert({
        user_id: userId,
        user_email: userEmail,
        property_id: input.propertyId || null,
        property_slug: input.propertySlug || null,
        action: input.action,
        entity_type: input.entityType || null,
        entity_id: input.entityId || null,
        metadata: input.metadata || {},
        ip_address: getClientIp(input.request),
        user_agent: getUserAgent(input.request),
      });

    if (error) {
      console.warn("AUDIT LOG INSERT ERROR:", error);
    }
  } catch (error) {
    console.warn("AUDIT LOG ERROR:", error);
  }
}

export async function writeBlockedAuditLog(input: AuditLogInput) {
  await writeAuditLog({
    ...input,
    metadata: {
      ...(input.metadata || {}),
      blocked: true,
    },
  });
}

export function forbiddenResponse(
  error = "Access denied",
  metadata?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(metadata ? { metadata } : {}),
    },
    {
      status: 403,
    }
  );
}

export function inactiveAccessResponse(
  accessContext: PartnerAccessContext
) {
  const unauthenticatedReasons = new Set([
    "unauthenticated_request",
    "missing_auth_session",
    "missing_authenticated_email",
  ]);

  const isUnauthenticated = unauthenticatedReasons.has(
    accessContext.reason
  );

  return NextResponse.json(
    {
      success: false,
      error: isUnauthenticated
        ? "Authentication required"
        : "Account is not active or not authorized",
      metadata: {
        access: buildAccessMetadata(accessContext),
      },
    },
    {
      status: isUnauthenticated ? 401 : 403,
    }
  );
}