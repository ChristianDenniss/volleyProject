"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImageUpIcon } from "lucide-react";
import { usePortalErrorToast } from "./portal-error-detail";
import { trpc } from "@/lib/trpc";
import {
  UPLOAD_ACCEPT,
  UPLOAD_MAX_BYTES,
  UPLOAD_MIME_TYPES,
  type UploadMimeType,
} from "@/lib/uploads";
import type { StoredUpload } from "@server/services/uploads";

export type ImageUploadScope = "article" | "asset";

type Phase = "idle" | "reading" | "uploading";

const buttonClass =
  "inline-flex cursor-pointer items-center gap-2 border-none bg-rvl-accent-bg px-3 py-2 font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-rvl-on-accent transition-opacity hover:enabled:opacity-85 disabled:cursor-not-allowed disabled:opacity-50";

function megabytes(bytes: number): string {
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
}

function readAsBase64(file: File, onProgress: (fraction: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress(event.loaded / event.total);
    };
    reader.onerror = () => reject(reader.error ?? new Error("The file could not be read"));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const comma = result.indexOf(",");
      if (comma === -1) {
        reject(new Error("The file could not be read"));
        return;
      }
      resolve(result.slice(comma + 1));
    };
    reader.readAsDataURL(file);
  });
}

export function ImageUpload({
  scope,
  label = "Image",
  onUploaded,
}: {
  scope: ImageUploadScope;
  label?: string;
  onUploaded: (upload: StoredUpload) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { showErrorToast } = usePortalErrorToast();
  const articleImage = trpc.uploads.createArticleImage.useMutation();
  const asset = trpc.uploads.createAsset.useMutation();
  const [phase, setPhase] = useState<Phase>("idle");
  const [readFraction, setReadFraction] = useState(0);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [stored, setStored] = useState<StoredUpload | null>(null);

  useEffect(() => {
    if (localPreview === null) return;
    return () => URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  const busy = phase !== "idle";
  const previewSrc =
    stored?.variants.find((variant) => variant.name === "card")?.url ?? stored?.url ?? localPreview;

  async function upload(file: File) {
    if (file.size > UPLOAD_MAX_BYTES) {
      showErrorToast(
        "Image too large",
        new Error(`${file.name} is ${megabytes(file.size)}; the limit is ${megabytes(UPLOAD_MAX_BYTES)}`),
      );
      return;
    }
    if (!UPLOAD_MIME_TYPES.includes(file.type as UploadMimeType)) {
      showErrorToast(
        "Unsupported image",
        new Error(`${file.name} must be one of ${UPLOAD_MIME_TYPES.join(", ")}`),
      );
      return;
    }

    setStored(null);
    setLocalPreview(URL.createObjectURL(file));
    setReadFraction(0);
    setPhase("reading");

    try {
      const data = await readAsBase64(file, setReadFraction);
      setPhase("uploading");
      const mutation = scope === "article" ? articleImage : asset;
      const result = await mutation.mutateAsync({ filename: file.name, data });
      setStored(result);
      onUploaded(result);
    } catch (error) {
      setLocalPreview(null);
      showErrorToast("Upload failed", error);
    } finally {
      setPhase("idle");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor={inputId}
        className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-rvl-ink-2"
      >
        {label}
      </label>

      <div className="flex items-start gap-4">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden border border-rvl-line bg-rvl-panel">
          {previewSrc ? (
            <img src={previewSrc} alt="" className="size-full object-cover" />
          ) : (
            <ImageUpIcon className="size-6 text-rvl-ink-2" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={UPLOAD_ACCEPT}
            disabled={busy}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={busy}
              className={buttonClass}
              onClick={() => inputRef.current?.click()}
            >
              {stored ? "Replace image" : "Choose image"}
            </button>
            <span className="truncate text-xs text-rvl-ink-2">
              {stored
                ? `${stored.filename} · ${stored.width}×${stored.height} · ${megabytes(stored.bytes)}`
                : `jpeg, png, webp or gif up to ${megabytes(UPLOAD_MAX_BYTES)}`}
            </span>
          </div>

          {busy ? (
            <div className="flex flex-col gap-1">
              <div className="h-1.5 w-full overflow-hidden bg-rvl-panel">
                <div
                  className={
                    phase === "reading"
                      ? "h-full bg-rvl-accent-bg transition-[width]"
                      : "h-full w-full animate-pulse bg-rvl-accent-bg"
                  }
                  style={phase === "reading" ? { width: `${Math.round(readFraction * 100)}%` } : undefined}
                />
              </div>
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-rvl-ink-2">
                {phase === "reading"
                  ? `Reading file ${Math.round(readFraction * 100)}%`
                  : "Uploading and building thumbnails"}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
