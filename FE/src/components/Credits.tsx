/**
 * Credits — the contributor wall: one card per person with their avatar, name and role.
 * Contributors live in the `CONTRIBUTORS` array so the page is a data edit away from listing a new one; a person holding two roles appears twice by design, once per role.
 * Lives in `components/`; routed at /credits.
 */
import LuvLateAvatar from "@/images/LuvLate.png";
import IlloultAvatar from "@/images/Illoult.png";
import stenimatedAvatar from "@/images/stenimated.png";

import PageContainer from "@/components/ui/layout/PageContainer";
import PageHeader from "@/components/ui/layout/PageHeader";
import Card from "@/components/ui/layout/Card";
import Avatar from "@/components/ui/misc/Avatar";

interface Contributor {
  name: string;
  role: string;
  avatar: string;
}

const CONTRIBUTORS: Contributor[] = [
  { name: "LuvLate", role: "Project Lead", avatar: LuvLateAvatar },
  { name: "Stenimated", role: "Systems & Deployment Engineer", avatar: stenimatedAvatar },
  { name: "LuvLate", role: "Fullstack Engineer", avatar: LuvLateAvatar },
  { name: "Illoult", role: "Graphic Designer", avatar: IlloultAvatar },
];

export default function CreditsPage() {
  return (
    <PageContainer width="wide">
      <PageHeader
        title="Our Contributors"
        subtitle="The folks who brought this project to life"
        align="center"
      />

      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
        {CONTRIBUTORS.map((contributor) => (
          <Card key={`${contributor.name}-${contributor.role}`} padding="lg" className="text-center">
            <div className="flex flex-col items-center gap-3">
              <Avatar src={contributor.avatar} name={contributor.name} size="xl" />
              <h3 className="m-0 text-base font-semibold text-content">{contributor.name}</h3>
              <p className="m-0 text-sm text-content-tertiary">{contributor.role}</p>
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
