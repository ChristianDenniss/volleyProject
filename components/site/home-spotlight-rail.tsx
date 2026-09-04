"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type SpotlightCard =
  | {
      kind: "article";
      href: string;
      title: string;
      imageUrl: string;
      date: string;
      fresh?: boolean;
    }
  | {
      kind: "stat";
      href: string;
      title: string;
      value: number;
      name: string;
    };

function Card({ card }: { card: SpotlightCard }) {
  if (card.kind === "article") {
    return (
      <Link
        href={card.href}
        className="relative block aspect-3/4 w-[13.5rem] shrink-0 snap-start overflow-hidden border border-rvl-line no-underline sm:w-[15.5rem]"
      >
        <img src={card.imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-transparent" />
        {card.fresh ? (
          <span className="absolute top-3 right-3 bg-rvl-accent-bg px-2 py-0.5 font-mono text-[0.58rem] font-bold uppercase tracking-[0.16em] text-rvl-on-accent">
            New
          </span>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="m-0 text-[1.02rem] font-bold leading-tight text-white">{card.title}</h3>
          <span className="mt-2 block font-mono text-[0.62rem] uppercase tracking-[0.14em] text-white/70">
            {card.date}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={card.href}
      className="relative flex aspect-3/4 w-[13.5rem] shrink-0 snap-start flex-col justify-end overflow-hidden border border-rvl-line bg-rvl-ink no-underline sm:w-[15.5rem]"
    >
      <img
        src="/images/blue_texture_strip.png"
        alt=""
        className="absolute inset-0 size-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
      <div className="relative p-4">
        <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.2em] text-rvl-accent-bg">
          {card.title}
        </span>
        <div className="mt-3 font-mono text-[2.6rem] font-bold leading-none tracking-[-0.045em] tabular-nums text-rvl-accent-bg">
          {card.value}
        </div>
        <div className="mt-2 text-[0.95rem] font-semibold text-white/90">{card.name}</div>
      </div>
    </Link>
  );
}

export function HomeSpotlightRail({ cards }: { cards: SpotlightCard[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  if (cards.length === 0) return null;

  const scrollBy = (direction: -1 | 1) => {
    const node = scroller.current;
    if (!node) return;
    node.scrollBy({ left: direction * (node.clientWidth * 0.7), behavior: "smooth" });
  };

  return (
    <section className="relative -mt-28 pb-6 sm:-mt-32" aria-label="Latest from the league">
      <div className="pointer-events-none absolute inset-y-0 right-4 z-10 hidden items-center md:flex">
        <button
          type="button"
          aria-label="Scroll spotlight right"
          onClick={() => scrollBy(1)}
          className="pointer-events-auto flex size-10 cursor-pointer items-center justify-center border border-rvl-line bg-rvl-ground text-rvl-ink"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
      <button
        type="button"
        aria-label="Scroll spotlight left"
        onClick={() => scrollBy(-1)}
        className={cn(
          "absolute top-1/2 left-4 z-10 hidden size-10 -translate-y-1/2 cursor-pointer",
          "items-center justify-center border border-rvl-line bg-rvl-ground text-rvl-ink md:flex",
        )}
      >
        <ChevronLeft className="size-5" />
      </button>

      <div
        ref={scroller}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:gap-4 sm:px-8 xl:px-14"
      >
        {cards.map((card) => (
          <Card key={`${card.kind}-${card.href}-${card.title}`} card={card} />
        ))}
      </div>
    </section>
  );
}
