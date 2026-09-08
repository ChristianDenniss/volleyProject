"use client";

import { useEffect, useRef, useState } from "react";
import { useListQuery } from "@/hooks/use-list-query";
import {
  ClearFiltersButton,
  FilterSelect,
  Pagination,
  SearchBar,
  type FilterOption,
} from "./controls";

const SEARCH_DEBOUNCE_MS = 300;

export function UrlSearchBar({
  paramKey = "q",
  placeholder,
  className,
}: {
  paramKey?: string;
  placeholder?: string;
  className?: string;
}) {
  const { get, setParams } = useListQuery();
  const fromUrl = get(paramKey);
  const [value, setValue] = useState(fromUrl);
  const latest = useRef(fromUrl);

  useEffect(() => {
    if (fromUrl !== latest.current) {
      latest.current = fromUrl;
      setValue(fromUrl);
    }
  }, [fromUrl]);

  useEffect(() => {
    if (value === latest.current) return;

    const timer = setTimeout(() => {
      latest.current = value;
      setParams({ [paramKey]: value === "" ? null : value });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [value, paramKey, setParams]);

  return (
    <SearchBar
      value={value}
      onSearch={setValue}
      {...(placeholder === undefined ? {} : { placeholder })}
      {...(className === undefined ? {} : { className })}
    />
  );
}

export function UrlFilterSelect({
  id,
  label,
  paramKey,
  options,
  placeholder,
  className,
}: {
  id: string;
  label: string;
  paramKey: string;
  options: FilterOption[];
  placeholder?: string;
  className?: string;
}) {
  const { get, setParams } = useListQuery();

  return (
    <FilterSelect
      id={id}
      label={label}
      value={get(paramKey)}
      onChange={(value) => setParams({ [paramKey]: value === "" ? null : value })}
      options={options}
      {...(placeholder === undefined ? {} : { placeholder })}
      {...(className === undefined ? {} : { className })}
    />
  );
}

export function UrlPagination({
  totalPages,
  variant = "default",
}: {
  totalPages: number;
  variant?: "default" | "compact";
}) {
  const { page, setPage } = useListQuery();
  if (totalPages <= 1) return null;

  return (
    <Pagination
      currentPage={Math.min(page, totalPages)}
      totalPages={totalPages}
      onPageChange={setPage}
      variant={variant}
    />
  );
}

export function UrlClearFilters({ keys }: { keys: string[] }) {
  const { get, clear } = useListQuery();
  const active = keys.some((key) => get(key) !== "");
  if (!active) return null;

  return <ClearFiltersButton onClick={() => clear(keys)} />;
}
