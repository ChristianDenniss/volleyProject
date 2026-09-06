"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@server/trpc/root";
import { PORTAL_SKIP_REGION_HEADER } from "@/lib/region";

export const trpc = createTRPCReact<AppRouter>();

async function trpcFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init);
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("json")) return response;

  const snippet = (await response.clone().text()).replace(/\s+/g, " ").trim().slice(0, 180);
  throw new Error(
    `Expected JSON from the API, got ${response.status} ${contentType || "unknown type"}: ${snippet}`,
  );
}

function trpcFetchForLink(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (!init) return trpcFetch(input);
  const { signal, ...rest } = init;
  return trpcFetch(input, signal === undefined ? rest : { ...rest, signal });
}

export function TrpcProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [client] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
          fetch: trpcFetchForLink as NonNullable<Parameters<typeof httpBatchLink>[0]["fetch"]>,
          headers() {
            if (typeof window !== "undefined" && window.location.pathname.startsWith("/portal")) {
              return { [PORTAL_SKIP_REGION_HEADER]: "1" };
            }
            return {};
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
