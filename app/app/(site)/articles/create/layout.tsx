import type { ReactNode } from "react";
import { requireSession } from "@server/session";

export default async function CreateArticleLayout({ children }: { children: ReactNode }) {
  await requireSession("/articles/create");
  return <>{children}</>;
}
