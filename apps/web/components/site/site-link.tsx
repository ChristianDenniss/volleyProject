"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";

type SiteLinkProps = ComponentProps<typeof NextLink>;

/** Defaults prefetch off: Vinext otherwise RSC-fetches every in-viewport href in production. */
export function SiteLink({ prefetch = false, ...props }: SiteLinkProps) {
  return <NextLink prefetch={prefetch} {...props} />;
}
