import { getDb } from "@db";
import { articles } from "@server/services";
import { PortalPage } from "@components/portal/portal-page";
import { ArticlesManager } from "@components/portal/articles-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Articles — Portal" };

export default async function PortalArticlesPage() {
  const rows = await articles.list(getDb());

  return (
    <PortalPage
      title="Articles"
      description="Articles are written on the public site and appear here for review. Only a published article shows on /articles."
    >
      <ArticlesManager rows={rows} />
    </PortalPage>
  );
}
