"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Listener = (pending: boolean) => void;

const listeners = new Set<Listener>();
let pending = false;
let timeout: ReturnType<typeof setTimeout> | null = null;

function emit(next: boolean) {
  pending = next;
  for (const listener of listeners) listener(next);
}

export function beginSiteNav() {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(endSiteNav, 12_000);
  emit(true);
}

export function endSiteNav() {
  if (timeout) {
    clearTimeout(timeout);
    timeout = null;
  }
  emit(false);
}

function subscribeSiteNav(listener: Listener) {
  listeners.add(listener);
  listener(pending);
  return () => {
    listeners.delete(listener);
  };
}

function isInternalNavClick(event: MouseEvent) {
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  const target = event.target;
  if (!(target instanceof Element)) return false;
  const link = target.closest("a");
  if (!(link instanceof HTMLAnchorElement) || link.hasAttribute("download")) return false;
  if (link.target && link.target !== "_self") return false;
  if (link.origin !== window.location.origin) return false;
  const next = link.pathname + link.search;
  const current = window.location.pathname + window.location.search;
  return next !== current;
}

export function SiteNavProgress() {
  const pathname = usePathname();
  const searchKey = useSearchParams().toString();
  const [active, setActive] = useState(pending);

  useEffect(() => subscribeSiteNav(setActive), []);

  useEffect(() => {
    endSiteNav();
  }, [pathname, searchKey]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (isInternalNavClick(event)) beginSiteNav();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("nav-pending", active);
    return () => document.documentElement.classList.remove("nav-pending");
  }, [active]);

  return (
    <div
      role="progressbar"
      aria-hidden={!active}
      aria-valuetext={active ? "Loading page" : undefined}
      className={
        active
          ? "pointer-events-none absolute inset-x-0 bottom-0 z-60 h-0.5 overflow-hidden bg-rvl-accent-soft/40"
          : "pointer-events-none absolute inset-x-0 bottom-0 z-60 h-0.5 overflow-hidden opacity-0"
      }
    >
      {active ? (
        <div className="h-full w-1/3 bg-rvl-accent-bg motion-safe:animate-[site-nav-indeterminate_1.1s_ease-in-out_infinite]" />
      ) : null}
    </div>
  );
}
