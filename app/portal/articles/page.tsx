import { portalApi } from "@server/trpc/server";
import { PortalPage } from "@components/portal/portal-page";
import { ArticlesManager } from "@components/portal/articles-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Articles · Portal" };

export default async function PortalArticlesPage() {
  const rows = await (await portalApi()).articles.listAll();

  return (
    <PortalPage
      title="Articles"
      description="Click an article to preview how it looks on the site. Approve or reject it from the list or the preview. Only a published article shows on /articles."
    >
      <ArticlesManager rows={rows} />
    </PortalPage>
  );
}
