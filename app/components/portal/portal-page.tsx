import type { ReactNode } from "react";

export function PortalPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1200px]">
      <h1 className="mb-2 text-[2.5rem] font-bold text-[#1e3d59] max-md:text-[2rem]">{title}</h1>
      {description ? <p className="mb-8 text-base text-[#666]">{description}</p> : null}
      {children}
    </div>
  );
}
