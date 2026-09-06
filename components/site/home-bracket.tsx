import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatSetDiff, formatWinPct, type StandingRow } from "@/lib/standings";

const PLACE_TONE = {
  1: "bg-[#b8892a] text-[#1a1408]",
  2: "bg-rvl-line-strong text-rvl-ink",
  3: "bg-[#8a5a2b] text-[#1a1208]",
} as const;

const PLACE_BLOCK = {
  1: "h-20 sm:h-28",
  2: "h-14 sm:h-20",
  3: "h-10 sm:h-16",
} as const;

const PLACE_LOGO = {
  1: "size-16 sm:size-20",
  2: "size-14 sm:size-16",
  3: "size-12 sm:size-14",
} as const;

function teamHref(name: string) {
  return `/teams/${encodeURIComponent(name)}`;
}

function PodiumPlace({ row, place }: { row: StandingRow; place: 1 | 2 | 3 }) {
  return (
    <Link
      href={teamHref(row.name)}
      className="flex min-w-0 flex-col items-center text-center text-inherit no-underline transition-colors hover:text-rvl-accent"
    >
      {row.logoUrl ? (
        <img
          src={row.logoUrl}
          alt=""
          className={cn(
            "rounded-xs border border-rvl-line object-cover",
            PLACE_LOGO[place],
          )}
        />
      ) : (
        <span
          className={cn(
            "flex items-center justify-center rounded-xs border border-rvl-line bg-rvl-panel font-mono font-bold text-rvl-dim",
            PLACE_LOGO[place],
          )}
        >
          {row.name.slice(0, 1)}
        </span>
      )}
      <span className="mt-3 text-[0.95rem] font-bold leading-tight sm:text-[1.1rem]">{row.name}</span>
      <span className="mt-1 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-dim">
        {row.wins}–{row.losses}
      </span>
      <span
        className={cn(
          "mt-4 flex w-full items-center justify-center font-mono text-[1.35rem] font-bold tabular-nums sm:text-[1.7rem]",
          PLACE_BLOCK[place],
          PLACE_TONE[place],
        )}
      >
        {place}
      </span>
    </Link>
  );
}

function Podium({ rows }: { rows: StandingRow[] }) {
  const first = rows[0];
  const second = rows[1];
  const third = rows[2];
  if (!first) return null;

  return (
    <div
      aria-label="Top three teams"
      className="grid grid-cols-3 items-end gap-2 sm:gap-6"
    >
      <div>{second ? <PodiumPlace row={second} place={2} /> : null}</div>
      <PodiumPlace row={first} place={1} />
      <div>{third ? <PodiumPlace row={third} place={3} /> : null}</div>
    </div>
  );
}

function StandingTable({ rows }: { rows: StandingRow[] }) {
  if (rows.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr>
            {["#", "Team", "GP", "W", "L", "Sets", "Diff", "Pct", "Stage"].map((label) => (
              <th
                key={label}
                className={cn(
                  "border-b border-rvl-line-strong pb-3 font-mono text-[0.6rem] font-bold uppercase tracking-[0.2em] text-rvl-dim",
                  label === "#" || label === "Team" ? "pr-4 text-left" : "px-4 text-right",
                )}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="transition-colors hover:bg-rvl-panel">
              <td className="border-b border-rvl-line py-3.5 pr-4 font-mono text-[0.72rem] tabular-nums text-rvl-dim">
                {row.rank}
              </td>
              <td className="border-b border-rvl-line py-3.5 pr-4">
                <Link
                  href={teamHref(row.name)}
                  className="inline-flex items-center gap-2.5 text-inherit no-underline hover:text-rvl-accent"
                >
                  {row.logoUrl ? (
                    <img
                      src={row.logoUrl}
                      alt=""
                      className="size-7 shrink-0 rounded-xs border border-rvl-line object-cover"
                    />
                  ) : null}
                  <span className="text-[0.98rem] font-semibold">{row.name}</span>
                </Link>
              </td>
              <td className="border-b border-rvl-line px-4 py-3.5 text-right font-mono text-[0.88rem] tabular-nums text-rvl-ink-2">
                {row.played}
              </td>
              <td className="border-b border-rvl-line px-4 py-3.5 text-right font-mono text-[0.88rem] font-bold tabular-nums text-rvl-ink">
                {row.wins}
              </td>
              <td className="border-b border-rvl-line px-4 py-3.5 text-right font-mono text-[0.88rem] tabular-nums text-rvl-ink-2">
                {row.losses}
              </td>
              <td className="border-b border-rvl-line px-4 py-3.5 text-right font-mono text-[0.88rem] tabular-nums text-rvl-ink-2">
                {row.setsFor}–{row.setsAgainst}
              </td>
              <td
                className={cn(
                  "border-b border-rvl-line px-4 py-3.5 text-right font-mono text-[0.88rem] tabular-nums",
                  row.setDiff > 0
                    ? "text-rvl-mint"
                    : row.setDiff < 0
                      ? "text-rvl-dim"
                      : "text-rvl-ink-2",
                )}
              >
                {formatSetDiff(row.setDiff)}
              </td>
              <td className="border-b border-rvl-line px-4 py-3.5 text-right font-mono text-[0.88rem] tabular-nums text-rvl-ink-2">
                {formatWinPct(row.wins, row.played)}
              </td>
              <td className="border-b border-rvl-line px-4 py-3.5 text-right font-mono text-[0.62rem] uppercase tracking-[0.12em] text-rvl-dim">
                {row.placement ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const HOME_BRACKET_LIMIT = 10;

export function HomeBracket({
  phase,
  standings,
}: {
  phase: string;
  standings: StandingRow[];
}) {
  const top = standings.slice(0, HOME_BRACKET_LIMIT);
  if (top.length === 0) return null;

  return (
    <section
      aria-label="Bracket"
      className="border-t border-rvl-line px-5 py-14 sm:px-8 sm:py-20 xl:px-14"
    >
      <div className="mb-12">
        <h2 className="m-0 mb-3 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
          Bracket
        </h2>
        <p className="m-0 mb-4 text-[0.84rem] text-rvl-dim">
          {phase} standings — who sits where in the table.
        </p>
        <Link
          href="/teams"
          className="border-b border-rvl-line pb-0.5 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-rvl-ink-2 no-underline transition-colors hover:border-rvl-accent-soft hover:text-rvl-accent"
        >
          Teams
        </Link>
      </div>

      <div className="flex flex-col gap-12">
        <Podium rows={top.slice(0, 3)} />
        <StandingTable rows={top.slice(3)} />
      </div>
    </section>
  );
}
