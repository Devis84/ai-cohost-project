export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase/supabase-server";

type RouteContext = {
  params:
    | {
        slug: string;
      }
    | Promise<{
        slug: string;
      }>;
};

type PropertyRecord = {
  id: string;
  slug?: string | null;
  property_name?: string | null;
  knowledge_base?: Record<string, unknown> | null;
};

const HERO_IMAGE_BUCKET = "guest-images";

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

function safeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getFileExtension(file: File) {
  const type = file.type.toLowerCase();

  if (type === "image/png") {
    return "png";
  }

  if (type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

function sanitizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildUpdatedKnowledgeBase({
  property,
  heroImageUrl,
}: {
  property: PropertyRecord;
  heroImageUrl: string;
}) {
  const existingKnowledgeBase =
    property.knowledge_base &&
    typeof property.knowledge_base === "object"
      ? property.knowledge_base
      : {};

  const existingGuestPage =
    existingKnowledgeBase.guest_page &&
    typeof existingKnowledgeBase.guest_page === "object"
      ? (existingKnowledgeBase.guest_page as Record<string, unknown>)
      : {};

  return {
    ...existingKnowledgeBase,
    guest_page: {
      ...existingGuestPage,
      hero_image_url: heroImageUrl,
    },
  };
}

async function findPropertyBySlug(slug: string) {
  const cleanSlug = decodeURIComponent(slug).trim();

  const { data: bySlug, error: bySlugError } =
    await supabaseServer
      .from("properties")
      .select("id, slug, property_name, knowledge_base")
      .eq("slug", cleanSlug)
      .maybeSingle();

  if (bySlugError) {
    console.error("HERO IMAGE PROPERTY LOOKUP BY SLUG FAILED:", bySlugError);
  }

  if (bySlug) {
    return bySlug as PropertyRecord;
  }

  const { data: byName, error: byNameError } =
    await supabaseServer
      .from("properties")
      .select("id, slug, property_name, knowledge_base")
      .eq("property_name", cleanSlug)
      .maybeSingle();

  if (byNameError) {
    console.error("HERO IMAGE PROPERTY LOOKUP BY NAME FAILED:", byNameError);
  }

  if (byName) {
    return byName as PropertyRecord;
  }

  return null;
}

async function ensureBucketExists() {
  const { data: buckets, error: listError } =
    await supabaseServer.storage.listBuckets();

  if (listError) {
    console.error("SUPABASE STORAGE LIST BUCKETS FAILED:", listError);
    return;
  }

  const alreadyExists = buckets?.some(
    (bucket) => bucket.name === HERO_IMAGE_BUCKET
  );

  if (alreadyExists) {
    return;
  }

  const { error: createError } =
    await supabaseServer.storage.createBucket(HERO_IMAGE_BUCKET, {
      public: true,
      fileSizeLimit: MAX_IMAGE_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_IMAGE_TYPES,
    });

  if (createError) {
    console.error("SUPABASE STORAGE CREATE BUCKET FAILED:", createError);
  }
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const params = await context.params;
    const slug = safeString(params.slug).trim();

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          error: "Property slug is required",
        },
        {
          status: 400,
        }
      );
    }

    const property = await findPropertyBySlug(slug);

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

    const formData = await request.formData();
    const rawFile = formData.get("file");

    if (!(rawFile instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "Image file is required. Upload it using the form field name 'file'.",
        },
        {
          status: 400,
        }
      );
    }

    const file = rawFile;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported image type. Please upload JPG, PNG or WEBP.",
        },
        {
          status: 400,
        }
      );
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: "Image is too large. Maximum allowed size is 8 MB.",
        },
        {
          status: 400,
        }
      );
    }

    await ensureBucketExists();

    const propertySlug =
      sanitizeSlug(safeString(property.slug)) ||
      sanitizeSlug(slug) ||
      property.id;

    const extension = getFileExtension(file);
    const timestamp = Date.now();

    const storagePath = `${propertySlug}/hero-${timestamp}.${extension}`;

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const { error: uploadError } =
      await supabaseServer.storage
        .from(HERO_IMAGE_BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType: file.type,
          upsert: true,
          cacheControl: "31536000",
        });

    if (uploadError) {
      console.error("HERO IMAGE UPLOAD FAILED:", uploadError);

      return NextResponse.json(
        {
          success: false,
          error:
            "Image upload failed. Please make sure the Supabase Storage bucket 'guest-images' exists and is public.",
          details: uploadError.message,
        },
        {
          status: 500,
        }
      );
    }

    const { data: publicUrlData } =
      supabaseServer.storage
        .from(HERO_IMAGE_BUCKET)
        .getPublicUrl(storagePath);

    const heroImageUrl = publicUrlData.publicUrl;

    if (!heroImageUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not generate public image URL.",
        },
        {
          status: 500,
        }
      );
    }

    const updatedKnowledgeBase = buildUpdatedKnowledgeBase({
      property,
      heroImageUrl,
    });

    const { data: updatedProperty, error: updateError } =
      await supabaseServer
        .from("properties")
        .update({
          knowledge_base: updatedKnowledgeBase,
          updated_at: new Date().toISOString(),
        })
        .eq("id", property.id)
        .select("id, slug, property_name, knowledge_base")
        .maybeSingle();

    if (updateError) {
      console.error("HERO IMAGE PROPERTY UPDATE FAILED:", updateError);

      return NextResponse.json(
        {
          success: false,
          error: "Image uploaded, but property update failed.",
          heroImageUrl,
          details: updateError.message,
        },
        {
          status: 500,
        }
      );
    }

    try {
      await supabaseServer.from("audit_logs").insert({
        property_id: property.id,
        property_slug: property.slug || slug,
        action: "property_hero_image_uploaded",
        entity_type: "property",
        entity_id: property.id,
        metadata: {
          property_slug: property.slug || slug,
          property_name: property.property_name || null,
          bucket: HERO_IMAGE_BUCKET,
          storage_path: storagePath,
          hero_image_url: heroImageUrl,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
        },
      });
    } catch (auditError) {
      console.error("HERO IMAGE AUDIT LOG FAILED:", auditError);
    }

    return NextResponse.json({
      success: true,
      heroImageUrl,
      storagePath,
      property: updatedProperty,
    });
  } catch (error) {
    console.error("HERO IMAGE API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while uploading the hero image.",
      },
      {
        status: 500,
      }
    );
  }
}