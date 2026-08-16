import { getSessionUser } from "@server/session";
import { isAdmin } from "@server/services/users";
import { SiteNavBar } from "./site-nav-bar";

export async function SiteNav() {
  const user = await getSessionUser();

  return <SiteNavBar isAdmin={user !== null && isAdmin(user.role)} />;
}
