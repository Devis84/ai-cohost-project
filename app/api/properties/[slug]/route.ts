 export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase/supabase-server";
import {
  canDeleteProperty,
  canEditProperty,
  canViewProperty,
  getPartnerAccessContext,
  inactiveAccessResponse,
  writeAuditLog,
  writeBlockedAuditLog,
  forbiddenResponse,
} from "@/lib/partner-access";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type PropertyPayload = {
  id?: string;
  created_at?: string;
  updated_at?: string;
  property_name?: string;
  name?: string;
  title?: string;
  slug?: string;
  city?: string;
  country?: string;
  address?: string;
  wifi_name?: string;
  wifi_password?: string;
  checkin_time?: string;
  checkout_time?: string;
  house_rules?: string;
  checkin_instructions?: string;
  description?: string;
  amenities?: string;
  ai_knowledge?: string;
  local_info?: string;
  emergency_info?: string;
  parking_info?: string;
  emergency_numbers?: string;
  lockbox_code?: string;
  knowledge_base?: unknown;
  ai_enabled?: boolean;
  whatsapp_enabled?: boolean;
  telegram_enabled?: boolean;
  welcomebook_enabled?: boolean;
};

type PropertyRow = {
  id: string;
  slug: string | null;
  property_name: string | null;
  [key: string]: unknown;
};

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function findProperty(identifier: string) {
  const cleanIdentifier =
    decodeURIComponent(identifier).trim();

  if (!cleanIdentifier) {
    return null;
  }

  const { data: byId } = await supabaseServer
    .from("properties")
    .select("*")
    .eq("id", cleanIdentifier)
    .maybeSingle();

  if (byId) {
    return byId as PropertyRow;
  }

  const { data: bySlug } = await supabaseServer
    .from("properties")
    .select("*")
    .eq("slug", cleanIdentifier)
    .maybeSingle();

  if (bySlug) {
    return bySlug as PropertyRow;
  }

  const { data: byName } = await supabaseServer
    .from("properties")
    .select("*")
    .eq("property_name", cleanIdentifier)
    .maybeSingle();

  if (byName) {
    return byName as PropertyRow;
  }

  return null;
}

function cleanUpdatePayload(body: PropertyPayload) {
  const payload: Record<string, unknown> = {
    ...body,
  };

  delete payload.id;
  delete payload.created_at;
  delete payload.updated_at;

  if (
    typeof payload.property_name === "string" &&
    !payload.slug
  ) {
    payload.slug = createSlug(payload.property_name);
  }

  return payload;
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const accessContext =
      await getPartnerAccessContext(request);

    if (!accessContext.isActive) {
      return inactiveAccessResponse(accessContext);
    }

    const { slug } = await context.params;

    const property = await findProperty(slug);

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          error: "Property not found",
        },
        {
          status: 404,
        }
      );
    }

    const allowed = await canViewProperty(
      property,
      accessContext
    );

    if (!allowed) {
      await writeBlockedAuditLog({
        request,
        accessContext,
        action: "unauthorized_property_access_blocked",
        entityType: "property",
        entityId: property.id,
        propertyId: property.id,
        propertySlug: property.slug,
        metadata: {
          method: "GET",
          requested_identifier: slug,
        },
      });

      return forbiddenResponse(
        "You do not have permission to view this property."
      );
    }

    await writeAuditLog({
      request,
      accessContext,
      action: "property_viewed",
      entityType: "property",
      entityId: property.id,
      propertyId: property.id,
      propertySlug: property.slug,
      metadata: {
        method: "GET",
        requested_identifier: slug,
      },
    });

    return NextResponse.json({
      success: true,
      property,
    });
  } catch (error) {
    console.error(
      "GET /api/properties/[slug] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load property",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const accessContext =
      await getPartnerAccessContext(request);

    if (!accessContext.isActive) {
      return inactiveAccessResponse(accessContext);
    }

    const { slug } = await context.params;

    const property = await findProperty(slug);

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          error: "Property not found",
        },
        {
          status: 404,
        }
      );
    }

    const allowed = await canEditProperty(
      property,
      accessContext
    );

    if (!allowed) {
      await writeBlockedAuditLog({
        request,
        accessContext,
        action: "property_update_attempt_blocked",
        entityType: "property",
        entityId: property.id,
        propertyId: property.id,
        propertySlug: property.slug,
        metadata: {
          method: "PATCH",
          requested_identifier: slug,
          reason: "missing_edit_permission",
        },
      });

      return forbiddenResponse(
        "You do not have permission to edit this property."
      );
    }

    const body =
      (await request.json()) as PropertyPayload;

    const payload = cleanUpdatePayload(body);

    const { data, error } = await supabaseServer
      .from("properties")
      .update(payload)
      .eq("id", property.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    await writeAuditLog({
      request,
      accessContext,
      action: "property_updated",
      entityType: "property",
      entityId: property.id,
      propertyId: property.id,
      propertySlug:
        typeof data.slug === "string"
          ? data.slug
          : property.slug,
      metadata: {
        method: "PATCH",
        requested_identifier: slug,
        property_name: data.property_name,
        slug: data.slug,
      },
    });

    return NextResponse.json({
      success: true,
      property: data,
    });
  } catch (error) {
    console.error(
      "PATCH /api/properties/[slug] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to update property",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const accessContext =
      await getPartnerAccessContext(request);

    if (!accessContext.isActive) {
      return inactiveAccessResponse(accessContext);
    }

    const { slug } = await context.params;

    const property = await findProperty(slug);

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          error: "Property not found",
        },
        {
          status: 404,
        }
      );
    }

    const allowed = await canDeleteProperty(
      property,
      accessContext
    );

    if (!allowed) {
      await writeBlockedAuditLog({
        request,
        accessContext,
        action: "property_delete_attempt_blocked",
        entityType: "property",
        entityId: property.id,
        propertyId: property.id,
        propertySlug: property.slug,
        metadata: {
          method: "DELETE",
          requested_identifier: slug,
          reason: "missing_delete_permission",
        },
      });

      return forbiddenResponse(
        "You do not have permission to delete this property."
      );
    }

    const { error } = await supabaseServer
      .from("properties")
      .delete()
      .eq("id", property.id);

    if (error) {
      throw error;
    }

    await writeAuditLog({
      request,
      accessContext,
      action: "property_deleted",
      entityType: "property",
      entityId: property.id,
      propertyId: property.id,
      propertySlug: property.slug,
      metadata: {
        method: "DELETE",
        requested_identifier: slug,
        property_name: property.property_name,
      },
    });

    return NextResponse.json({
      success: true,
      deleted: true,
      propertyId: property.id,
    });
  } catch (error) {
    console.error(
      "DELETE /api/properties/[slug] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete property",
      },
      {
        status: 500,
      }
    );
  }
}