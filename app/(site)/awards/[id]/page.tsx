import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@server/trpc/server";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

// Cached so generateMetadata and the page share one fetch per request.
const load = cache(async (id: string) => {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return (await api()).awards.byId({ id: parsed });
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const award = await load(id);
  if (!award) return { title: "Award not found" };

  const names = award.players.map((player) => player.name).join(", ");
  const title = award.seasonNumber ? `${award.type} · Season ${award.seasonNumber}` : award.type;
  const description = names ? `${title}: ${names}. ${award.description}` : award.description;

  return {
    title,
    description,
    openGraph: { title, description, images: award.imageUrl ? [award.imageUrl] : undefined },
  };
}

export default async function AwardPage({ params }: Params) {
  const { id } = await params;
  const award = await load(id);
  if (!award) notFound();

  return (
    <div className="font-display">
      <header className="border-b border-rvl-line px-5 py-12 sm:px-8 sm:py-14 xl:px-14">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
          <div>
            <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
              {award.seasonNumber ? `Season ${award.seasonNumber}` : "Award"}
            </span>
            <h1 className="mt-4 mb-5 text-balance text-[2.2rem] font-black uppercase leading-[0.95] tracking-[-0.035em] sm:text-[2.9rem]">
              {award.type}
            </h1>
            <p className="m-0 max-w-[52ch] text-[1.02rem] text-rvl-ink-2">{award.description}</p>
          </div>

          {award.imageUrl ? (
            <img
              src={award.imageUrl}
              alt=""
              className="aspect-4/3 w-full border border-rvl-line object-cover"
            />
          ) : null}
        </div>
      </header>

      <section className="grid grid-cols-1 gap-8 border-b border-rvl-line px-5 py-12 sm:px-8 md:grid-cols-[210px_1fr] md:gap-14 xl:px-14">
        <div>
          <h2 className="m-0 mb-3 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
            Recipients
          </h2>
          <p className="m-0 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-dim">
            {award.players.length} named
          </p>
        </div>

        {award.players.length === 0 ? (
          <p className="m-0 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-rvl-dim">
            Unassigned
          </p>
        ) : (
          <ul className="m-0 list-none border-t border-rvl-line p-0">
            {award.players.map((player) => (
              <li key={player.id} className="border-b border-rvl-line">
                <Link
                  href={`/players/${player.id}`}
                  className="block py-4 text-[1.05rem] font-semibold capitalize text-inherit no-underline transition-colors hover:text-rvl-accent"
                >
                  {player.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
