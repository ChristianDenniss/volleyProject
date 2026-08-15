import type { Metadata } from "next";
import { PageHeader, Section } from "@components/site/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";

export const metadata: Metadata = {
  title: "About",
  description:
    "Volleyball 4.2 is the competitive volleyball experience on Roblox, and this site is the hub for the Roblox Volleyball League.",
};

const SECTIONS = [
  {
    title: "League management",
    intro: "A complete ecosystem for competitive volleyball:",
    items: [
      "Team management and roster tracking",
      "Season organization and scheduling",
      "Game statistics and performance metrics",
      "Player profiles with career statistics and achievements",
      "Award tracking and recognition",
    ],
  },
  {
    title: "Statistical analysis",
    intro: "In-depth tracking for every aspect of the game:",
    items: [
      "Player performance metrics",
      "Team statistics and historical data",
      "Season-by-season comparisons",
      "Career progression tracking",
      "Per-game statistics",
    ],
  },
  {
    title: "Community",
    intro: "Stay connected with the volleyball community:",
    items: [
      "News articles and game highlights",
      "Team and player profiles",
      "Match schedules and results",
      "Community announcements and updates",
      "Direct integration with our Discord community",
    ],
  },
  {
    title: "Administration",
    intro: "Tools for running the league:",
    items: [
      "User role management and permissions",
      "Content moderation and approval",
      "Team and player registration",
      "Game result verification",
      "Data management across every season",
    ],
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Roblox Volleyball League"
        title="About Volleyball 4.2"
        description="The central hub for the Roblox Volleyball League, with tools for players, teams and fans."
      />
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          {SECTIONS.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>{section.intro}</p>
                <ul className="list-disc space-y-1 pl-5">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}
