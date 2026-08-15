import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@db";
import { seasons } from "@server/services";
import { EmptyState } from "@components/site/empty-state";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seasons",
  description: "Every season of the Roblox Volleyball League, newest first.",
};

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Present";

export default async function SeasonsPage() {
  const rows = await seasons.list(getDb());

  return (
    <div className="mx-auto box-border min-h-screen w-full max-w-[1480px] px-8 pb-16 pt-14 text-[#222] max-md:px-5">
      <h1 className="mb-11 text-center text-[2.4rem] font-extrabold max-[600px]:text-[2rem]">
        All Seasons
      </h1>

      {rows.length === 0 ? (
        <EmptyState>No seasons have been created yet.</EmptyState>
      ) : (
        <div className="grid grid-cols-3 gap-10 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
          {rows.map((season) => (
            <div
              key={season.id}
              className="box-border flex min-h-[300px] min-w-[325px] flex-col overflow-hidden rounded-[14px] border border-[#e6f2ff] bg-white shadow-[0_2px_6px_rgba(0,0,0,0.05)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_6px_12px_rgba(0,0,0,0.08)] max-[600px]:min-w-0"
            >
              <img
                src={season.image ?? "/images/callToAction.png"}
                alt={`Season ${season.seasonNumber} banner`}
                className="aspect-[16/6] w-full rounded-t-[14px] object-cover"
              />

              <div className="flex flex-1 flex-col px-10 pb-8 max-[600px]:px-9">
                <header className="m-0 flex items-center gap-3">
                  <h2 className="m-0 text-[1.6rem] font-bold">Season {season.seasonNumber}</h2>
                  <div className="m-0 flex items-center text-base font-semibold text-[#5d6673]">
                    {formatDate(season.startDate)} – {formatDate(season.endDate)}
                  </div>
                </header>

                <ul className="m-0 list-none p-0 text-[1.1rem] font-semibold leading-relaxed text-[#4a4a4a]">
                  <li>
                    <strong>Theme:</strong> {season.theme ?? "N/A"}
                  </li>
                  <li className="mt-3">
                    <strong>Teams:</strong> {season.teamCount}
                  </li>
                  <li className="mt-3">
                    <strong>Games:</strong> {season.gameCount}
                  </li>
                </ul>

                <footer className="-m-4 text-right">
                  <Link
                    href={`/seasons/${season.id}`}
                    className="text-[0.95rem] font-bold leading-none text-[#78b5fa] no-underline hover:underline"
                  >
                    View Details →
                  </Link>
                </footer>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
