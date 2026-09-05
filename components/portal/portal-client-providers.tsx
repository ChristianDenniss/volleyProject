"use client";

import type { ReactNode } from "react";
import { PortalErrorDetailProvider } from "./portal-error-detail";

export function PortalClientProviders({ children }: { children: ReactNode }) {
  return <PortalErrorDetailProvider>{children}</PortalErrorDetailProvider>;
}
