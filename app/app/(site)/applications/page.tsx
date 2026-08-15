import type { Metadata } from "next";
import { PageHeader, Section } from "@components/site/page-header";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";

export const metadata: Metadata = {
  title: "Applications",
  description: "Staff, media, officiating and management positions in the Roblox Volleyball League.",
};

type Status = "open" | "closed";

interface Application {
  name: string;
  type: string;
  description: string;
  url?: string;
  status: Status;
}

const GROUPS: { category: string; applications: Application[] }[] = [
  {
    category: "Staff positions",
    applications: [
      {
        name: "Staff application",
        type: "General staff position",
        description:
          "Apply to become a staff member of the Roblox Volleyball League. Help manage the community and keep each season running.",
        url: "https://forms.gle/TgpFMdP8zVmyqKjk6",
        status: "closed",
      },
    ],
  },
  {
    category: "Media and content",
    applications: [
      {
        name: "Media team application",
        type: "Content creation and streaming",
        description:
          "Create content, stream RVL matches, manage social media and help promote the league.",
        url: "https://forms.gle/L6QFsuztCaJMRQyp8",
        status: "closed",
      },
    ],
  },
  {
    category: "Game officials",
    applications: [
      {
        name: "Referee application",
        type: "Game officiating",
        description:
          "Officiate volleyball matches, keep play fair and hold the game to its rules.",
        status: "closed",
      },
      {
        name: "Game moderator application",
        type: "Game officiating",
        description:
          "Moderate ranked Volleyball 4.2 games, act on rule violations and keep play fair for everyone.",
        status: "closed",
      },
    ],
  },
  {
    category: "Management and support",
    applications: [
      {
        name: "Server moderator application",
        type: "Community management",
        description:
          "Moderate our Discord spaces, enforce the rules and keep the environment positive.",
        status: "closed",
      },
      {
        name: "Stats team application",
        type: "Data management",
        description:
          "Track player statistics and game data, and keep the records accurate through the playoffs.",
        status: "closed",
      },
      {
        name: "Host application",
        type: "Event management",
        description:
          "Organise events outside Volleyball 4.2 and keep the community active with casual pickup matches.",
        status: "closed",
      },
    ],
  },
];

export default function ApplicationsPage() {
  return (
    <>
      <PageHeader
        title="Applications"
        description="Positions open and closed across the league. Closed positions reopen when we need them, so check back."
      />
      <Section>
        <div className="space-y-10">
          {GROUPS.map((group) => (
            <div key={group.category}>
              <h2 className="mb-4 text-lg font-semibold tracking-tight">{group.category}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {group.applications.map((application) => (
                  <Card key={application.name} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-base">{application.name}</CardTitle>
                          <p className="text-xs uppercase tracking-wide text-brand-steel">
                            {application.type}
                          </p>
                        </div>
                        <Badge variant={application.status === "open" ? "default" : "secondary"}>
                          {application.status === "open" ? "Open" : "Closed"}
                        </Badge>
                      </div>
                      <CardDescription className="pt-2">{application.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto">
                      {application.status === "open" && application.url ? (
                        <Button asChild size="sm">
                          <a href={application.url} target="_blank" rel="noopener noreferrer">
                            Open the form
                          </a>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          Currently closed
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
