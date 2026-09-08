import { portalApi } from "@server/trpc/server";
import { pageParam, stringParam, type SearchParams } from "@/lib/search-params";
import { PortalPage } from "@components/portal/portal-page";
import { UsersManager } from "@components/portal/users-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Users · Portal" };

export default async function PortalUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = await (
    await portalApi()
  ).users.listPage({
    page: pageParam(params),
    search: stringParam(params, "q"),
  });

  return (
    <PortalPage
      title="Users"
      description="Accounts are created by signing in with Roblox. The only thing editable here is the role."
    >
      <UsersManager
        rows={page.rows}
        paging={{ total: page.total, totalPages: page.totalPages }}
      />
    </PortalPage>
  );
}
