import { cache } from "react";
import { headers } from "next/headers";
import { createCaller } from "./root";
import { createContext } from "./context";

// Memoized per request: building the context resolves the session, so a page that
// calls api() from generateMetadata and again from the component would otherwise
// hit the session store once per call.
export const api = cache(async () => createCaller(await createContext(await headers())));
