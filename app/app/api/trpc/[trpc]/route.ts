import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@server/trpc/root";
import { createContext } from "@server/trpc/context";

function handler(request: Request): Promise<Response> {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: () => createContext(request),
  });
}

export const GET = handler;
export const POST = handler;
