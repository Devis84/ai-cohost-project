"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type UploadStatus =
  | "idle"
  | "ready"
  | "uploading"
  | "success"
  | "error";

type PropertyHeroImageUploaderProps = {
  propertySlug?: string | null;
  propertyName?: string | null;
  currentImageUrl?: string | null;
  disabled?: boolean;
  onUploaded?: (heroImageUrl: string) => void;
};

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 MB";
  }

  const megabytes = bytes / (1024 * 1024);

  return `${megabytes.toFixed(1)} MB`;
}

function isValidImageType(file: File) {
  return ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase());
}

export default function PropertyHeroImageUploader({
  propertySlug,
  propertyName,
  currentImageUrl,
  disabled = false,
  onUploaded,
}: PropertyHeroImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(
    currentImageUrl || ""
  );
  const [status, setStatus] =
    useState<UploadStatus>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(currentImageUrl || "");
    }
  }, [currentImageUrl, selectedFile]);

  const hasProperty = Boolean(propertySlug);

  const canUpload = useMemo(() => {
    return (
      hasProperty &&
      Boolean(selectedFile) &&
      !disabled &&
      status !== "uploading"
    );
  }, [hasProperty, selectedFile, disabled, status]);

  function resetSelection() {
    setSelectedFile(null);
    setPreviewUrl(currentImageUrl || "");
    setStatus("idle");
    setMessage("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    setMessage("");

    if (!file) {
      setSelectedFile(null);
      setStatus("idle");
      return;
    }

    if (!isValidImageType(file)) {
      setSelectedFile(null);
      setStatus("error");
      setMessage(
        "Unsupported image type. Please upload JPG, PNG or WEBP."
      );

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setSelectedFile(null);
      setStatus("error");
      setMessage(
        `Image is too large (${formatFileSize(
          file.size
        )}). Maximum allowed size is 8 MB.`
      );

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      return;
    }

    const objectUrl = URL.createObjectURL(file);

    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setStatus("ready");
    setMessage(
      `${file.name} selected. Click upload to update the guest page image.`
    );
  }

  async function uploadImage() {
    if (!propertySlug || !selectedFile || !canUpload) {
      return;
    }

    setStatus("uploading");
    setMessage("Uploading image...");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(
        `/api/properties/${encodeURIComponent(
          propertySlug
        )}/hero-image`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            data.details ||
            "Image upload failed."
        );
      }

      const heroImageUrl =
        typeof data.heroImageUrl === "string"
          ? data.heroImageUrl
          : "";

      if (!heroImageUrl) {
        throw new Error(
          "Image uploaded, but no public image URL was returned."
        );
      }

      setPreviewUrl(heroImageUrl);
      setSelectedFile(null);
      setStatus("success");
      setMessage("Hero image updated successfully.");
      onUploaded?.(heroImageUrl);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Image upload failed."
      );
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          Guest Page Image
        </p>

        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">
              Welcome page hero image
            </h3>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Upload the main image shown at the top of the guest welcome page.
              This is the image guests see when they open the QR/NFC guest page
              for{" "}
              <span className="font-medium text-slate-700">
                {propertyName || "this property"}
              </span>
              .
            </p>
          </div>

          {disabled ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              Upload disabled
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={`${propertyName || "Property"} hero image`}
              className="h-44 w-full object-cover"
            />
          ) : (
            <div className="flex h-44 items-center justify-center px-5 text-center text-sm text-slate-400">
              No hero image uploaded yet.
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              disabled={disabled || !hasProperty || status === "uploading"}
              onChange={handleFileChange}
              className="block w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white disabled:cursor-not-allowed disabled:opacity-50"
            />

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
              <p>
                Recommended: landscape photo, at least 1600px wide.
              </p>
              <p>
                Supported formats: JPG, PNG, WEBP. Maximum size: 8 MB.
              </p>
              <p>
                The image will be uploaded to Supabase Storage and linked to
                the selected property guest page.
              </p>
            </div>

            {!hasProperty ? (
              <p className="text-sm text-amber-600">
                Select or save a property before uploading a hero image.
              </p>
            ) : null}

            {selectedFile ? (
              <p className="text-sm text-slate-500">
                Selected:{" "}
                <span className="font-medium text-slate-700">
                  {selectedFile.name}
                </span>{" "}
                ({formatFileSize(selectedFile.size)})
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              disabled={!canUpload}
              onClick={uploadImage}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {status === "uploading"
                ? "Uploading..."
                : "Upload hero image"}
            </button>

            <button
              type="button"
              disabled={status === "uploading" || !selectedFile}
              onClick={resetSelection}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Cancel selection
            </button>

            {message ? (
              <p
                className={[
                  "text-sm",
                  status === "error"
                    ? "text-red-600"
                    : status === "success"
                      ? "text-emerald-600"
                      : "text-slate-500",
                ].join(" ")}
              >
                {message}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}