import type { ReactNode } from "react";

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[20px] border-2 border-[#CFFFFF] bg-[#f3f9ff] px-6 py-12 text-center text-base text-[#333]">
      {children}
    </div>
  );
}
