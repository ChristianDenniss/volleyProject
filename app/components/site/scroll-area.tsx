import type { ReactNode } from "react";

export function HorizontalScroll({ children }: { children: ReactNode }) {
  return <div className="w-full overflow-x-auto">{children}</div>;
}
