"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export interface AwardListRow {
  id: number;
  type: string;
  description: string | null;
  imageUrl: string | null;
  seasonId: number | null;
  seasonNumber: number | null;
  players: { id: number; name: string }[];
}

const selectClass =
  "rounded-lg border border-[#ccc] bg-white px-3 py-1.5 text-[0.95rem] text-[#222] transition-colors duration-200 focus:border-[#8f54ff] focus:outline-none";

export function AwardsList({ awards }: { awards: AwardListRow[] }) {
  const [season, setSeason] = useState("");
  const [type, setType] = useState("");

  const seasons = useMemo(() => {
    const values = new Set<number>();
    awards.forEach((award) => {
      if (award.seasonNumber != null) values.add(award.seasonNumber);
    });
    return [...values].sort((a, b) => b - a);
  }, [awards]);

  const types = useMemo(() => {
    const values = new Set<string>();
    awards.forEach((award) => values.add(award.type));
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [awards]);

  const visible = useMemo(
    () =>
      awards.filter(
        (award) =>
          (!season || String(award.seasonNumber) === season) && (!type || award.type === type),
      ),
    [awards, season, type],
  );

  return (
    <>
      <div className="flex min-h-[60px] flex-wrap items-center justify-center gap-4 max-[480px]:min-h-20">
        <select
          value={season}
          onChange={(event) => setSeason(event.target.value)}
          className={selectClass}
          aria-label="Filter by season"
        >
          <option value="">All Seasons</option>
          {seasons.map((value) => (
            <option key={value} value={String(value)}>
              Season {value}
            </option>
          ))}
        </select>

        <select
          value={type}
          onChange={(event) => setType(event.target.value)}
          className={selectClass}
          aria-label="Filter by award"
        >
          <option value="">All Awards</option>
          {types.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="grid w-full [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))] [column-gap:clamp(1rem,2vw,1.4rem)] [row-gap:clamp(1.5rem,3vw,2.2rem)] max-[480px]:grid-cols-1">
        {visible.map((award) => (
          <Link
            key={award.id}
            href={`/awards/${award.id}`}
            style={
              award.imageUrl ? { backgroundImage: `url(${award.imageUrl})` } : undefined
            }
            className="group relative box-border flex min-h-[200px] cursor-pointer flex-col gap-2.5 overflow-hidden rounded-2xl border border-brand-ink bg-cover bg-right p-5 text-inherit no-underline shadow-[0_2px_4px_rgba(0,0,0,0.15)] transition-[transform,box-shadow,border-color] duration-250 hover:-translate-y-1 hover:scale-[1.02] hover:border-[#8f54ff] hover:shadow-[0_6px_14px_rgba(0,0,0,0.35)]"
          >
            <span className="pointer-events-none absolute inset-0 bg-black/40 transition-colors duration-250 group-hover:bg-black/30" />

            <span className="relative z-1 inline-block w-min whitespace-nowrap rounded-full bg-[#333]/80 px-3.5 py-1.5 text-[1.05rem] font-semibold leading-none text-white backdrop-blur-[2px]">
              {award.type}
            </span>

            {award.seasonNumber != null ? (
              <span className="relative z-1 inline-block w-min whitespace-nowrap rounded-full bg-[#c9e4fd]/25 px-3.5 py-1.5 text-[1.05rem] font-medium leading-none text-[#c9e4fd] backdrop-blur-[2px] transition-all duration-200 hover:bg-[#a9d6f5]/35 hover:text-[#a9d6f5]">
                Season {award.seasonNumber}
              </span>
            ) : null}

            {award.players.map((player) => (
              <span
                key={player.id}
                className="relative z-1 inline-block w-min whitespace-nowrap rounded-full bg-[#c9e4fd]/25 px-3.5 py-1.5 text-[1.05rem] font-medium capitalize leading-none text-[#c9e4fd] backdrop-blur-[2px] transition-all duration-200 hover:bg-[#a9d6f5]/35 hover:text-[#a9d6f5]"
              >
                {player.name}
              </span>
            ))}
          </Link>
        ))}
      </div>
    </>
  );
}
