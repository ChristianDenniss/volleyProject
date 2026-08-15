import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@db";
import { awards } from "@server/services";
import { PageHeader, Section } from "@components/site/page-header";
import { Card, CardHeader, CardTitle } from "@components/ui/card";

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
    <>
      <PageHeader
        eyebrow={award.seasonNumber ? `Season ${award.seasonNumber}` : undefined}
        title={award.type}
        description={award.description}
      />
      <Section title="Recipients">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {award.players.map((player) => (
            <Card key={player.id}>
              <CardHeader>
                <CardTitle className="text-base capitalize">
                  <Link href={`/players/${player.id}`}>{player.name}</Link>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{player.position}</p>
              </CardHeader>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}
