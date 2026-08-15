import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@db";
import { articles } from "@server/services";
import { getSessionUser } from "@server/session";
import { EmptyState, PageHeader, Section } from "@components/site/page-header";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Articles",
  description: "League news, match reports and highlights written by the community.",
};

export default async function ArticlesPage() {
  const [rows, user] = await Promise.all([
    articles.list(getDb(), { approvedOnly: true }),
    getSessionUser(),
  ]);

  return (
    <>
      <PageHeader
        title="Articles"
        description="League news, match reports and highlights."
        actions={
          user ? (
            <Button asChild size="sm">
              <Link href="/articles/create">Write an article</Link>
            </Button>
          ) : undefined
        }
      />
      <Section>
        {rows.length === 0 ? (
          <EmptyState>Nothing has been published yet.</EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((article) => (
              <Card key={article.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base">
                    <Link href={`/articles/${article.id}`}>{article.title}</Link>
                  </CardTitle>
                  <CardDescription>{article.summary}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                  <span>by {article.authorName}</span>
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
