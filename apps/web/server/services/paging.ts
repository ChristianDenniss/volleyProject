export const DEFAULT_PER_PAGE = 25;
export const MAX_PER_PAGE = 100;

export interface PageQuery {
  page?: number | undefined;
  perPage?: number | undefined;
  search?: string | undefined;
}

export interface Page<Row> {
  rows: Row[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface PageBounds {
  page: number;
  perPage: number;
  offset: number;
}

export function pageBounds(query: PageQuery = {}): PageBounds {
  const perPage = Math.min(Math.max(Math.trunc(query.perPage ?? DEFAULT_PER_PAGE), 1), MAX_PER_PAGE);
  const page = Math.max(Math.trunc(query.page ?? 1), 1);
  return { page, perPage, offset: (page - 1) * perPage };
}

export function searchTerm(query: PageQuery = {}): string | null {
  const trimmed = query.search?.trim() ?? "";
  return trimmed === "" ? null : trimmed.toLowerCase();
}

export function likePattern(term: string): string {
  return `%${term.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
}

export function makePage<Row>(rows: Row[], total: number, bounds: PageBounds): Page<Row> {
  return {
    rows,
    total,
    page: bounds.page,
    perPage: bounds.perPage,
    totalPages: Math.max(Math.ceil(total / bounds.perPage), 1),
  };
}

export function emptyPage<Row>(bounds: PageBounds): Page<Row> {
  return makePage<Row>([], 0, bounds);
}
