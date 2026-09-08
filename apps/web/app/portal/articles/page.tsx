import { portalApi } from "@server/trpc/server";
import { pageParam, stringParam, type SearchParams } from "@/lib/search-params";
import { PortalPage } from "@components/portal/portal-page";
import { ArticlesManager } from "@components/portal/articles-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Articles · Portal" };

const STATUSES = ["pending", "published", "rejected"] as const;

type Status = (typeof STATUSES)[number];

function parseStatus(value: string | undefined): Status | undefined {
  return STATUSES.find((status) => status === value);
}

export default async function PortalArticlesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const trpc = await portalApi();
  const raw = stringParam(params, "status");
  const status = raw === undefined ? "pending" : parseStatus(raw);

  const [page, counts] = await Promise.all([
    trpc.articles.listAllPage({
      page: pageParam(params),
      search: stringParam(params, "q"),
      status,
    }),
    trpc.articles.statusCounts(),
  ]);

  return (
    <PortalPage
      title="Articles"
      description="Click an article to preview how it looks on the site. Approve or reject it from the list or the preview. Only a published article shows on /articles."
    >
      <ArticlesManager
        rows={page.rows}
        paging={{ total: page.total, totalPages: page.totalPages }}
        counts={counts}
        status={status ?? "all"}
      />
    </PortalPage>
  );
}
