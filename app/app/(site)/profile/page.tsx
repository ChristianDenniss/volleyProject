import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@db";
import { users } from "@server/services";
import { requireSession } from "@server/session";
import { EmptyState, PageHeader, Section } from "@components/site/page-header";
import { Badge } from "@components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { StatRow, StatTile } from "@components/site/stat-tile";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your account and the articles you have written.",
};

export default async function ProfilePage() {
  const session = await requireSession("/profile");
  const profile = await users.profile(getDb(), session.id);
  if (!profile) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Signed in with Roblox"
        title={profile.name}
        description={
          <span className="flex items-center gap-2">
            <Badge variant="secondary">{profile.role}</Badge>
            <span>Roblox username: {profile.email}</span>
          </span>
        }
      />

      <Section>
        <StatRow>
          <StatTile label="Articles" value={profile.articleCount} />
          <StatTile label="Role" value={profile.role} />
          <StatTile
            label="Joined"
            value={new Date(profile.createdAt).toISOString().slice(0, 10)}
          />
          <StatTile label="Account status" value={profile.banned ? "Banned" : "Active"} />
        </StatRow>
      </Section>

      <Section title="Your articles">
        {profile.articles.length === 0 ? (
          <EmptyState>
            You have not written anything yet. <Link href="/articles/create">Write an article</Link>.
          </EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {profile.articles.map((article) => (
              <Card key={article.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    <Link href={`/articles/${article.id}`}>{article.title}</Link>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{article.summary}</p>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
                  <Badge variant={article.approved ? "secondary" : "outline"}>
                    {article.approved === null
                      ? "Awaiting review"
                      : article.approved
                        ? "Published"
                        : "Rejected"}
                  </Badge>
                  <span>{article.likes} likes</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
