export type SearchParams = Record<string, string | string[] | undefined>;

export function stringParam(params: SearchParams, key: string): string | undefined {
  const raw = params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === undefined || value.trim() === "" ? undefined : value;
}

export function numberParam(params: SearchParams, key: string): number | undefined {
  const parsed = Number.parseInt(stringParam(params, key) ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function pageParam(params: SearchParams): number {
  return numberParam(params, "page") ?? 1;
}
