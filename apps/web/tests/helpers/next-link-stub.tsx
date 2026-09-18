import type { AnchorHTMLAttributes, ReactNode } from "react";

export default function Link({
  href,
  children,
  prefetch,
  replace: _replace,
  scroll: _scroll,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children?: ReactNode;
  prefetch?: boolean | "auto" | null;
  replace?: boolean;
  scroll?: boolean;
}) {
  return (
    <a
      href={href}
      data-prefetch={prefetch === undefined ? undefined : String(prefetch)}
      {...props}
    >
      {children}
    </a>
  );
}
