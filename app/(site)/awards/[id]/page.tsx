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
  const title = award.seasonNumber ? `${award.type} — Season ${award.seasonNumber}` : award.type;
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
    <div className="bg-rvl-ground px-5 py-12 font-display text-rvl-ink sm:px-8 sm:py-16 xl:px-14">
      <article className="mx-auto max-w-[1050px] overflow-hidden border border-rvl-line bg-rvl-ground">
        <header
          style={award.imageUrl ? { backgroundImage: `url(${award.imageUrl})` } : undefined}
          className="relative h-80 bg-[#0c0d10] bg-cover bg-center max-[600px]:h-[220px]"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-b from-black/55 via-black/35 to-black/55"
          />
          <div className="absolute top-1/2 left-1/2 z-1 w-[90%] max-w-[900px] -translate-x-1/2 -translate-y-1/2 text-center">
            <h1 className="mb-4 text-balance font-display text-[2.8rem] font-black uppercase leading-[0.92] tracking-[-0.035em] text-white sm:text-[4rem] lg:text-[5rem] max-[600px]:text-[2.4rem]">
              {award.type}
            </h1>
            {award.seasonNumber ? (
              <span className="inline-block font-mono text-[0.84rem] font-semibold uppercase tracking-[0.2em] text-white/80 sm:text-[1rem]">
                Season {award.seasonNumber}
              </span>
            ) : null}
          </div>
        </header>

        {award.description ? (
          <div className="border-b border-rvl-line bg-rvl-panel px-6 py-7 sm:px-8">
            <p className="m-0 text-[1.05rem] leading-[1.55] text-rvl-ink-2">{award.description}</p>
          </div>
        ) : null}

        <div className="grid gap-10 px-6 py-10 sm:px-8 sm:py-12">
          <section>
            <h2 className="mt-0 mb-4 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
              Recipient(s)
            </h2>
            <p className="m-0 text-[1.25rem] font-semibold capitalize">
              {award.players.length === 0
                ? "Unassigned"
                : award.players.map((player, index) => (
                    <span key={player.id}>
                      {index > 0 ? ", " : ""}
                      <Link
                        href={`/players/${player.id}`}
                        className="text-inherit no-underline transition-colors hover:text-rvl-accent"
                      >
                        {player.name}
                      </Link>
                    </span>
                  ))}
            </p>
          </section>

          <section className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-8 border border-rvl-line bg-rvl-panel p-6">
            <div className="flex flex-col gap-1.5">
              <h3 className="m-0 font-mono text-[0.62rem] font-bold uppercase tracking-[0.2em] text-rvl-dim">
                Award
              </h3>
              <p className="m-0 font-display text-[1.15rem] font-bold uppercase tracking-[-0.02em]">
                {award.type}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="m-0 font-mono text-[0.62rem] font-bold uppercase tracking-[0.2em] text-rvl-dim">
                Season
              </h3>
              <p className="m-0 font-mono text-[1.15rem] font-semibold tabular-nums">
                {award.seasonNumber ? `Season ${award.seasonNumber}` : "No season"}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="m-0 font-mono text-[0.62rem] font-bold uppercase tracking-[0.2em] text-rvl-dim">
                Recipient(s)
              </h3>
              <p className="m-0 font-mono text-[1.15rem] font-semibold tabular-nums">
                {award.players.length}
              </p>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
