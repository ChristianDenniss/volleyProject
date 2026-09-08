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
import type { UploadState } from "@server/services/uploads";

export type ImageUploadScope = "article" | "asset";

type Phase = "idle" | "uploading" | "optimizing";

const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 60_000;

const buttonClass =
  "inline-flex cursor-pointer items-center gap-2 border-none bg-rvl-accent-bg px-3 py-2 font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-rvl-on-accent transition-opacity hover:enabled:opacity-85 disabled:cursor-not-allowed disabled:opacity-50";

function megabytes(bytes: number): string {
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
}

function putToR2(
  url: string,
  file: File,
  onProgress: (fraction: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("Content-Type", file.type);

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress(event.loaded / event.total);
    };
    request.onerror = () => reject(new Error("The upload could not reach storage"));
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error(`Storage rejected the upload (${request.status})`));
    };

    request.send(file);
  });
}

export function ImageUpload({
  scope,
  label = "Image",
  onUploaded,
}: {
  scope: ImageUploadScope;
  label?: string;
  onUploaded: (upload: UploadState) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { showErrorToast } = usePortalErrorToast();
  const articleUrl = trpc.uploads.createArticleImageUrl.useMutation();
  const assetUrl = trpc.uploads.createAssetUrl.useMutation();
  const utils = trpc.useUtils();
  const [phase, setPhase] = useState<Phase>("idle");
  const [sentFraction, setSentFraction] = useState(0);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [stored, setStored] = useState<UploadState | null>(null);

  useEffect(() => {
    if (localPreview === null) return;
    return () => URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  const busy = phase !== "idle";
  const previewSrc =
    stored?.variants.find((variant) => variant.name === "card")?.url ?? stored?.url ?? localPreview;

  async function waitForOptimization(id: string): Promise<UploadState> {
    const deadline = Date.now() + POLL_TIMEOUT_MS;

    for (;;) {
      const state = await utils.uploads.status.fetch({ id });
      if (state.status === "ready") return state;
      if (state.status === "failed") {
        throw new Error(state.error ?? "The image could not be processed");
      }
      if (Date.now() > deadline) {
        throw new Error("Timed out waiting for the image to be processed");
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  async function upload(file: File) {
    if (file.size > UPLOAD_MAX_BYTES) {
      showErrorToast(
        "Image too large",
        new Error(
          `${file.name} is ${megabytes(file.size)}; the limit is ${megabytes(UPLOAD_MAX_BYTES)}`,
        ),
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
    setSentFraction(0);
    setPhase("uploading");

    try {
      const mutation = scope === "article" ? articleUrl : assetUrl;
      const ticket = await mutation.mutateAsync({
        filename: file.name,
        contentType: file.type as UploadMimeType,
        bytes: file.size,
      });

      await putToR2(ticket.url, file, setSentFraction);

      setPhase("optimizing");
      const ready = await waitForOptimization(ticket.id);

      setStored(ready);
      onUploaded(ready);
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
              {stored && stored.width !== null && stored.height !== null
                ? `${stored.width}×${stored.height} · ${stored.variants.length} sizes`
                : `jpeg, png, webp or gif up to ${megabytes(UPLOAD_MAX_BYTES)}`}
            </span>
          </div>

          {busy ? (
            <div className="flex flex-col gap-1">
              <div className="h-1.5 w-full overflow-hidden bg-rvl-panel">
                <div
                  className={
                    phase === "uploading"
                      ? "h-full bg-rvl-accent-bg transition-[width]"
                      : "h-full w-full animate-pulse bg-rvl-accent-bg"
                  }
                  style={
                    phase === "uploading"
                      ? { width: `${Math.round(sentFraction * 100)}%` }
                      : undefined
                  }
                />
              </div>
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-rvl-ink-2">
                {phase === "uploading"
                  ? `Uploading ${Math.round(sentFraction * 100)}%`
                  : "Building thumbnails"}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
