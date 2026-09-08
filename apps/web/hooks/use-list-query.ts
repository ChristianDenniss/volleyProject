"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface ListQuery {
  get: (key: string) => string;
  page: number;
  pending: boolean;
  setParams: (patch: Record<string, string | null>, options?: { keepPage?: boolean }) => void;
  setPage: (page: number) => void;
  clear: (keys: string[]) => void;
}

export function useListQuery(): ListQuery {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const setParams = useCallback(
    (patch: Record<string, string | null>, options?: { keepPage?: boolean }) => {
      const next = new URLSearchParams(params);

      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }

      if (!options?.keepPage) next.delete("page");

      const query = next.toString();
      startTransition(() => {
        router.replace(query === "" ? pathname : `${pathname}?${query}`, { scroll: false });
      });
    },
    [params, pathname, router],
  );

  const rawPage = Number.parseInt(params.get("page") ?? "1", 10);

  return {
    get: (key: string) => params.get(key) ?? "",
    page: Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1,
    pending,
    setParams,
    setPage: (page: number) =>
      setParams({ page: page <= 1 ? null : String(page) }, { keepPage: true }),
    clear: (keys: string[]) =>
      setParams(Object.fromEntries(keys.map((key) => [key, null] as const))),
  };
}
