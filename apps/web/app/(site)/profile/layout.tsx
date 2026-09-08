import type { ReactNode } from "react";
import { requireSession } from "@server/session";

export default async function ProfileLayout({ children }: { children: ReactNode }) {
  await requireSession("/profile");
  return <>{children}</>;
}
