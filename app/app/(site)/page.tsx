import Link from "next/link";
import { getDb } from "@db";
import { articles, seasons } from "@server/services";
import { EmptyState, Section } from "@components/site/page-header";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { StatRow, StatTile } from "@components/site/stat-tile";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Volleyball 4-2 League",
  description:
    "The Roblox Volleyball League: seasons, teams, players, games, records and awards in one place.",
};

export default async function HomePage() {
  const db = getDb();
  const [latestArticles, allSeasons] = await Promise.all([
    articles.list(db, { approvedOnly: true }),
    seasons.list(db),
  ]);

  const current = allSeasons[0];
  const featured = latestArticles.slice(0, 3);

  return (
    <>
      <section className="border-b border-border bg-brand-navy text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">
            Roblox Volleyball League
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Every season, team and stat line of Volleyball 4.2
          </h1>
          <p className="mt-4 max-w-xl text-sm text-white/80">
            Rosters, results, leaderboards and records, kept current through the whole season.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <Link href="/seasons">Browse seasons</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <Link href="/stats">Stat leaders</Link>
            </Button>
          </div>
        </div>
      </section>

      {current ? (
        <Section title={`Season ${current.seasonNumber}`} description={current.theme ?? undefined}>
          <StatRow>
            <StatTile label="Teams" value={current.teamCount} />
            <StatTile label="Games" value={current.gameCount} />
            <StatTile label="Started" value={current.startDate} />
            <StatTile label="Ends" value={current.endDate ?? "In progress"} />
          </StatRow>
          <div className="mt-4">
            <Button asChild variant="outline" size="sm">
              <Link href={`/seasons/${current.id}`}>Open season {current.seasonNumber}</Link>
            </Button>
          </div>
        </Section>
      ) : null}

      <Section
        title="Latest articles"
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href="/articles">All articles</Link>
          </Button>
        }
      >
        {featured.length === 0 ? (
          <EmptyState>No articles have been published yet.</EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {featured.map((article) => (
              <Card key={article.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base">
                    <Link href={`/articles/${article.id}`}>{article.title}</Link>
                  </CardTitle>
                  <CardDescription>{article.summary}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto text-xs text-muted-foreground">
                  by {article.authorName}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
