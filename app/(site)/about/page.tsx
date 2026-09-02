import type { Metadata } from "next";
import { PageHeader, PageMetric } from "@components/site/page-header";

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
    <div className="font-display">
      <PageHeader
        eyebrow="The league"
        title="About Volleyball 4.2"
        description="The central hub for the Roblox Volleyball League, with tools for players, teams and fans."
        meta={
          <>
            <PageMetric label="Areas" value={SECTIONS.length} />
            <PageMetric label="Game" value="Volleyball 4.2" />
          </>
        }
      />

      {SECTIONS.map((section) => (
        <section
          key={section.title}
          className="grid grid-cols-1 gap-8 border-b border-rvl-line px-5 py-12 sm:px-8 md:grid-cols-[210px_1fr] md:gap-14 xl:px-14"
        >
          <div>
            <h2 className="m-0 mb-3 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
              {section.title}
            </h2>
            <p className="m-0 text-[0.84rem] text-rvl-dim">{section.intro}</p>
          </div>

          <ul className="m-0 grid list-none grid-cols-1 gap-x-10 gap-y-0 border-t border-rvl-line p-0 sm:grid-cols-2">
            {section.items.map((item) => (
              <li
                key={item}
                className="border-b border-rvl-line py-4 text-[0.98rem] text-rvl-ink-2"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
