import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@db";
import { awards } from "@server/services";
import { EmptyState, PageHeader, Section } from "@components/site/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Awards",
  description: "Season awards handed out across the Roblox Volleyball League.",
};

export default async function AwardsPage() {
  const rows = await awards.list(getDb());

  return (
    <>
      <PageHeader title="Awards" description="Season honours, by award type." />
      <Section>
        {rows.length === 0 ? (
          <EmptyState>No awards have been given out yet.</EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((award) => (
              <Card key={award.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    <Link href={`/awards/${award.id}`}>{award.type}</Link>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {award.seasonNumber ? `Season ${award.seasonNumber}` : "No season"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">{award.description}</p>
                  <p className="capitalize">
                    {award.players.map((player) => player.name).join(", ") || "Unassigned"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
