"use client";

import { CheckIcon, CopyIcon, OctagonXIcon, XIcon } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { formatErrorTitle, formatUnknownError } from "@/lib/format-error";
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

type PortalErrorApi = {
  /** Short toast; click opens the detail modal. */
  showErrorToast: (title: string, error: unknown) => void;
  /** Open the detail modal only — no toast (use inside dialogs / during import progress). */
  showErrorDetail: (title: string, error: unknown) => void;
};

const PortalErrorToastContext = createContext<PortalErrorApi | null>(null);

function formatError(error: unknown): string {
  return formatUnknownError(error);
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

  const showErrorDetail = useCallback(
    (title: string, error: unknown) => {
      openDetail(formatErrorTitle(error) || title, formatError(error));
    },
    [openDetail],
  );

  const showErrorToast = useCallback(
    (title: string, error: unknown) => {
      const message = formatError(error);
      const toastTitle = formatErrorTitle(error) || title;
      toast.custom(
        (id) => {
          const open = () => {
            toast.dismiss(id);
            openDetail(toastTitle, message);
          };
          const dismiss = (event: MouseEvent) => {
            event.stopPropagation();
            toast.dismiss(id);
          };
          return (
            <div className="cn-toast group toast relative flex w-[min(92vw,28rem)] items-start gap-3 rounded-lg border border-rvl-line bg-rvl-ground p-4 pr-10 text-left text-rvl-ink shadow-lg">
              <button
                type="button"
                onClick={open}
                className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left transition-opacity hover:opacity-90"
              >
                <OctagonXIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium">{toastTitle}</p>
                  <p className="text-xs text-rvl-ink-2">
                    {preview(message)} · Click for full details
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-rvl-accent">Details</span>
              </button>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={dismiss}
                className="absolute top-2 right-2 rounded-xs p-1 text-rvl-ink-2 transition-colors hover:bg-rvl-panel hover:text-rvl-ink"
              >
                <XIcon className="size-4" />
              </button>
            </div>
          );
        },
        { duration: 60_000, id: `portal-error-${Date.now()}` },
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
    <PortalErrorToastContext.Provider value={{ showErrorToast, showErrorDetail }}>
      {children}
      <Dialog open={detail != null} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="flex max-h-[92vh] w-[min(96vw,56rem)] flex-col gap-4 sm:max-w-[min(96vw,56rem)]">
          <DialogHeader>
            <DialogTitle>{detail?.title ?? "Error"}</DialogTitle>
            <DialogDescription>Full message from the server. You can scroll and copy it.</DialogDescription>
          </DialogHeader>
          <pre className="min-h-[50vh] max-h-[70vh] flex-1 overflow-auto rounded-lg border border-rvl-line bg-rvl-ground p-4 font-mono text-[0.78rem] leading-relaxed break-all whitespace-pre-wrap text-rvl-ink">
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

export function usePortalErrorToast(): PortalErrorApi {
  const api = useContext(PortalErrorToastContext);
  if (!api) {
    throw new Error("usePortalErrorToast requires PortalErrorDetailProvider");
  }
  return api;
}
