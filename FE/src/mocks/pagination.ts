import type { PaginatedResponse } from "../types/interfaces";

/**
 * Mirror BE parsePagination / toPaginatedResult so MSW list handlers
 * return the same shape the paginated hooks expect.
 */
export function toPaginatedResult<T>(
  items: T[],
  searchParams: URLSearchParams,
  filter?: (item: T, params: URLSearchParams) => boolean
): PaginatedResponse<T> {
  const rawPage = Number(searchParams.get("page"));
  const rawLimit = Number(searchParams.get("limit"));

  const page =
    Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit >= 1
      ? Math.min(Math.floor(rawLimit), 100)
      : 10;

  const filtered = filter
    ? items.filter((item) => filter(item, searchParams))
    : items;
  const total = filtered.length;
  const skip = (page - 1) * limit;
  const data = filtered.slice(skip, skip + limit);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
