import { headers } from "next/headers";
import { createCaller } from "./root";
import { createContext } from "./context";

export async function api() {
  return createCaller(await createContext(await headers()));
}
