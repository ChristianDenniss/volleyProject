import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@db";
import { seasons } from "@server/services";
import { EmptyState, PageHeader, Section } from "@components/site/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seasons",
  description: "Every season of the Roblox Volleyball League, newest first.",
};

export default async function SeasonsPage() {
  const rows = await seasons.list(getDb());

  return (
    <>
      <PageHeader title="Seasons" description="Every season, newest first." />
      <Section>
        {rows.length === 0 ? (
          <EmptyState>No seasons have been created yet.</EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((season) => (
              <Card key={season.id}>
                <CardHeader>
                  <CardTitle>
                    <Link href={`/seasons/${season.id}`}>Season {season.seasonNumber}</Link>
                  </CardTitle>
                  {season.theme ? (
                    <p className="text-sm text-muted-foreground">{season.theme}</p>
                  ) : null}
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <span>{season.teamCount} teams</span>
                  <span>{season.gameCount} games</span>
                  <span className="col-span-2">
                    {season.startDate} — {season.endDate ?? "in progress"}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
