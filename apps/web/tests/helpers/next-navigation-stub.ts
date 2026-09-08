export function useRouter() {
  return {
    push: () => {},
    replace: () => {},
    refresh: () => {},
    back: () => {},
    forward: () => {},
    prefetch: () => {},
    bfcacheId: "",
  };
}

export function usePathname() {
  return "/";
}

export function useSearchParams() {
  return new URLSearchParams();
}

export function useParams() {
  return {};
}

export function notFound(): never {
  throw new Error("notFound");
}

export function redirect(): never {
  throw new Error("redirect");
}
