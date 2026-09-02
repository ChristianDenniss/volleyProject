import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@db";
import { awards } from "@server/services";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

async function load(id: string) {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return awards.getById(getDb(), parsed);
}

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
    <div className="bg-[#0e0e0e] text-[#f5f5f5]">
      <div className="mx-auto my-16 box-border min-h-screen max-w-[1050px] overflow-hidden rounded-xl bg-[#0e0e0e] px-6 shadow-[0_8px_22px_rgba(0,0,0,0.45)] max-[600px]:my-8 max-[600px]:px-4">
        <header
          style={award.imageUrl ? { backgroundImage: `url(${award.imageUrl})` } : undefined}
          className="relative h-80 rounded-t-xl bg-cover bg-center max-[600px]:h-[220px]"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-b from-black/55 via-black/35 to-black/55"
          />
          <div className="absolute left-1/2 top-1/2 z-1 w-[90%] max-w-[900px] -translate-x-1/2 -translate-y-1/2 text-center">
            <h1 className="mb-4 whitespace-nowrap text-[5.5rem] font-bold text-[#c9e4fd] max-[600px]:text-[3.8rem] max-md:whitespace-normal">
              {award.type}
            </h1>
            {award.seasonNumber ? (
              <span className="inline-block text-[2.2rem] font-semibold text-[#f5f5f5] max-[600px]:text-[1.8rem]">
                Season {award.seasonNumber}
              </span>
            ) : null}
          </div>
        </header>

        <div className="border-b border-white/8 bg-[#161616] px-8 py-7">
          <p className="m-0 text-[1.25rem] leading-[1.55]">{award.description}</p>
        </div>

        <div className="grid gap-8 p-8 max-[600px]:p-6">
          <section>
            <h2 className="mb-3 mt-0 text-[1.8rem] text-[#c9e4fd]">Recipients</h2>
            <p className="text-[1.5rem]">
              {award.players.length === 0
                ? "Unassigned"
                : award.players.map((player, index) => (
                    <span key={player.id}>
                      {index > 0 ? ", " : ""}
                      <Link
                        href={`/players/${player.id}`}
                        className="text-[1.5rem] font-semibold capitalize text-[#f5f5f5] no-underline transition-colors duration-200 hover:text-[#c9e4fd]"
                      >
                        {player.name}
                      </Link>
                    </span>
                  ))}
            </p>
          </section>

          <section className="grid gap-5 rounded-xl bg-[#161616] p-6 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
            <div className="flex flex-col">
              <h3 className="mb-1.5 mt-0 text-[1.1rem] font-bold uppercase tracking-wider text-[#c1c1c1]">
                Award
              </h3>
              <p className="m-0 text-[1.25rem] font-semibold">{award.type}</p>
            </div>
            <div className="flex flex-col">
              <h3 className="mb-1.5 mt-0 text-[1.1rem] font-bold uppercase tracking-wider text-[#c1c1c1]">
                Season
              </h3>
              <p className="m-0 text-[1.25rem] font-semibold">
                {award.seasonNumber ? `Season ${award.seasonNumber}` : "No season"}
              </p>
            </div>
            <div className="flex flex-col">
              <h3 className="mb-1.5 mt-0 text-[1.1rem] font-bold uppercase tracking-wider text-[#c1c1c1]">
                Recipients
              </h3>
              <p className="m-0 text-[1.25rem] font-semibold">{award.players.length}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
