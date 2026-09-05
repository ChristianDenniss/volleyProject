"use client";

import { CheckIcon, CopyIcon, OctagonXIcon } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";

type ErrorDetail = { title: string; message: string };

const PortalErrorToastContext = createContext<((title: string, error: unknown) => void) | null>(
  null,
);

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

function preview(message: string, max = 100): string {
  const oneLine = message.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max)}…`;
}

export function PortalErrorDetailProvider({ children }: { children: ReactNode }) {
  const [detail, setDetail] = useState<ErrorDetail | null>(null);
  const [copied, setCopied] = useState(false);

  const openDetail = useCallback((title: string, message: string) => {
    setCopied(false);
    setDetail({ title, message });
  }, []);

  const showErrorToast = useCallback(
    (title: string, error: unknown) => {
      const message = formatError(error);
      const open = () => openDetail(title, message);
      toast.custom(
        () => (
          <button
            type="button"
            onClick={open}
            className="cn-toast group toast flex w-full cursor-pointer items-start gap-3 rounded-lg border border-rvl-line bg-rvl-ground p-4 text-left text-rvl-ink shadow-lg transition-opacity hover:opacity-90"
          >
            <OctagonXIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-rvl-ink-2">
                {preview(message)} · Click for full details
              </p>
            </div>
            <span className="shrink-0 text-xs font-medium text-rvl-accent">Details</span>
          </button>
        ),
        { duration: Number.POSITIVE_INFINITY, closeButton: true },
      );
    },
    [openDetail],
  );

  async function copyText() {
    if (!detail) return;
    await navigator.clipboard.writeText(detail.message);
    setCopied(true);
  }

  return (
    <PortalErrorToastContext.Provider value={showErrorToast}>
      {children}
      <Dialog open={detail != null} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="flex max-h-[85vh] w-[min(96vw,44rem)] max-w-2xl flex-col gap-3">
          <DialogHeader>
            <DialogTitle>{detail?.title ?? "Error"}</DialogTitle>
            <DialogDescription>Full message from the server. You can scroll and copy it.</DialogDescription>
          </DialogHeader>
          <pre className="max-h-[min(55vh,28rem)] overflow-auto rounded-lg border border-rvl-line bg-rvl-ground p-3 font-mono text-[0.72rem] leading-relaxed break-all whitespace-pre-wrap text-rvl-ink">
            {detail?.message}
          </pre>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button type="button" variant="outline" onClick={() => void copyText()}>
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? "Copied" : "Copy text"}
            </Button>
            <Button type="button" onClick={() => setDetail(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalErrorToastContext.Provider>
  );
}

export function usePortalErrorToast() {
  const showErrorToast = useContext(PortalErrorToastContext);
  if (!showErrorToast) {
    throw new Error("usePortalErrorToast requires PortalErrorDetailProvider");
  }
  return showErrorToast;
}
