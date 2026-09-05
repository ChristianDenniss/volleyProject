"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const DIRECTION_GAP = 8;

export function SiteHeaderChrome({
  utility,
  nav,
}: {
  utility: ReactNode;
  nav: ReactNode;
}) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const hiddenRef = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;

      if (y <= DIRECTION_GAP) {
        if (hiddenRef.current) {
          hiddenRef.current = false;
          setHidden(false);
        }
      } else if (delta > DIRECTION_GAP && !hiddenRef.current) {
        hiddenRef.current = true;
        setHidden(true);
      } else if (delta < -DIRECTION_GAP && hiddenRef.current) {
        hiddenRef.current = false;
        setHidden(false);
      }

      lastY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-compact={hidden || undefined}
      className={cn(
        "sticky z-50 w-full transition-[top] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "motion-reduce:transition-none",
      )}
      style={{ top: hidden ? "calc(var(--site-utility-h) * -1)" : 0 }}
      onFocusCapture={() => {
        if (!hiddenRef.current) return;
        hiddenRef.current = false;
        setHidden(false);
      }}
    >
      {utility}
      {nav}
    </header>
  );
}
