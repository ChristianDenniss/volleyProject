"use client";

import Link from "next/link";
import { awardBanner } from "@/lib/award-banners";
import { UrlClearFilters, UrlFilterSelect, UrlPagination } from "./url-controls";

export interface AwardListRow {
  id: number;
  type: string;
  description: string | null;
  imageUrl: string | null;
  seasonId: number | null;
  seasonNumber: number | null;
  players: { id: number; name: string }[];
}

const FILTER_KEYS = ["season", "type"];

export function AwardsList({
  awards,
  seasons,
  types,
  total,
  totalPages,
}: {
  awards: AwardListRow[];
  seasons: number[];
  types: string[];
  total: number;
  totalPages: number;
}) {
  return (
    <>
      <div className="flex flex-wrap items-end gap-5 border-b border-rvl-line px-5 py-7 sm:px-8 xl:px-14">
        <UrlFilterSelect
          id="award-season-filter"
          label="Season"
          paramKey="season"
          options={[
            { value: "", label: "All seasons" },
            ...seasons.map((value) => ({ value: String(value), label: `Season ${value}` })),
          ]}
        />

        <UrlFilterSelect
          id="award-type-filter"
          label="Award"
          paramKey="type"
          options={[
            { value: "", label: "All awards" },
            ...types.map((value) => ({ value, label: value })),
          ]}
        />

        <UrlClearFilters keys={FILTER_KEYS} />

        <span className="self-end pb-2.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-dim">
          {total} awards
        </span>

        <div className="ml-auto self-end">
          <UrlPagination variant="compact" totalPages={totalPages} />
        </div>
      </div>

      {awards.length === 0 ? (
        <div className="px-5 py-20 text-center font-mono text-[0.78rem] uppercase tracking-[0.14em] text-rvl-dim sm:px-8 xl:px-14">
          No awards match those filters.
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-6 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-3 xl:px-14 2xl:grid-cols-4">
        {awards.map((award) => {
          const banner = awardBanner(award.type, award.imageUrl);
          return (
            <Link
              key={award.id}
              href={`/awards/${award.id}`}
              className="group relative flex flex-col overflow-hidden border border-rvl-line p-6 text-inherit no-underline transition-colors hover:border-rvl-accent-soft"
            >
              {banner ? (
                <img
                  src={banner}
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
          );
        })}
      </div>
      )}
    </>
  );
}
