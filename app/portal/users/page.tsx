import { api } from "@server/trpc/server";
import { PortalPage } from "@components/portal/portal-page";
import { UsersManager } from "@components/portal/users-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Users · Portal" };

export default async function PortalUsersPage() {
  const rows = await (await api()).users.list();

  return (
    <PortalPage
      title="Users"
      description="Accounts are created by signing in with Roblox. The only thing editable here is the role."
    >
      <UsersManager rows={rows} />
    </PortalPage>
  );
}
