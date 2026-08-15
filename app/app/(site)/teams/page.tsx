import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@db";
import { teams } from "@server/services";
import { EmptyState, PageHeader, Section } from "@components/site/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Teams",
  description: "Every team that has played in the Roblox Volleyball League.",
};

export default async function TeamsPage() {
  const rows = await teams.list(getDb());

  return (
    <>
      <PageHeader title="Teams" description="Every roster in league history." />
      <Section>
        {rows.length === 0 ? (
          <EmptyState>No teams have been created yet.</EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    <Link href={`/teams/${encodeURIComponent(team.name)}`}>{team.name}</Link>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {team.seasonNumber ? `Season ${team.seasonNumber}` : "No season"}
                  </p>
                </CardHeader>
                <CardContent className="flex gap-4 text-sm text-muted-foreground">
                  <span>{team.playerCount} players</span>
                  <span>{team.gameCount} games</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
