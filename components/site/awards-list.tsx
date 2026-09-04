"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FilterSelect } from "./controls";

export interface AwardListRow {
  id: number;
  type: string;
  description: string | null;
  imageUrl: string | null;
  seasonId: number | null;
  seasonNumber: number | null;
  players: { id: number; name: string }[];
}

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
      <div className="flex flex-wrap items-end gap-5 border-b border-rvl-line px-5 py-7 sm:px-8 xl:px-14">
        <FilterSelect
          id="award-season-filter"
          label="Season"
          value={season}
          onChange={setSeason}
          options={[
            { value: "", label: "All seasons" },
            ...seasons.map((value) => ({ value: String(value), label: `Season ${value}` })),
          ]}
        />

        <FilterSelect
          id="award-type-filter"
          label="Award"
          value={type}
          onChange={setType}
          options={[
            { value: "", label: "All awards" },
            ...types.map((value) => ({ value, label: value })),
          ]}
        />

        <span className="self-end pb-2.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-dim">
          {visible.length} awards
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-3 xl:px-14 2xl:grid-cols-4">
        {visible.map((award) => (
          <Link
            key={award.id}
            href={`/awards/${award.id}`}
            className="group relative flex flex-col overflow-hidden border border-rvl-line p-6 text-inherit no-underline transition-colors hover:border-rvl-accent-soft"
          >
            {award.imageUrl ? (
              <img
                src={award.imageUrl}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 -top-8 size-36 object-contain opacity-[0.07] transition-opacity group-hover:opacity-15"
              />
            ) : null}

            <span className="relative font-mono text-[0.6rem] uppercase tracking-[0.2em] text-rvl-accent">
              Season {award.seasonNumber ?? "-"}
            </span>

            <h2 className="relative mt-3 mb-0 font-display text-[1.25rem] font-bold uppercase leading-tight tracking-[-0.02em]">
              {award.type}
            </h2>

            {award.description ? (
              <p className="relative m-0 mt-3 line-clamp-3 text-[0.88rem] text-rvl-ink-2">
                {award.description}
              </p>
            ) : null}

            <div className="relative mt-5 flex flex-wrap gap-2">
              {award.players.length > 0 ? (
                award.players.map((player) => (
                  <span
                    key={player.id}
                    className="border border-rvl-line px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-rvl-ink-2"
                  >
                    {player.name}
                  </span>
                ))
              ) : (
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-rvl-dim">
                  No recipient recorded
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
