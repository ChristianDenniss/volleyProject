import type { Metadata } from "next";

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
    <div className="mx-auto w-4/5 bg-[#F5F7FA] p-8 text-[#333] max-md:w-full max-md:p-4">
      <h1 className="relative mb-8 pb-4 text-center text-[2.5rem] font-extrabold text-[#333] max-md:text-[2rem]">
        About Volleyball 4.2
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-1/2 h-1 w-[100px] -translate-x-1/2 rounded-sm bg-brand-sky"
        />
      </h1>

      <p className="mx-auto mb-12 max-w-[800px] text-center text-xl leading-relaxed text-[#5d6673] max-md:text-[1.1rem]">
        The central hub for the Roblox Volleyball League, with tools for players, teams and fans.
      </p>

      {SECTIONS.map((section) => (
        <section
          key={section.title}
          className="mb-8 rounded-lg bg-white p-8 shadow-[0_2px_4px_rgba(0,0,0,0.1)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_6px_rgba(0,0,0,0.1)] max-md:p-6"
        >
          <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-[#333] max-md:text-xl">
            <span aria-hidden="true" className="block h-6 w-1 rounded-sm bg-brand-sky" />
            {section.title}
          </h2>
          <p className="mb-4 text-base text-[#5d6673]">{section.intro}</p>
          <ul className="m-0 grid list-none gap-4 p-0">
            {section.items.map((item) => (
              <li
                key={item}
                className="rounded-lg border border-[#e2e8f0] bg-[#F5F7FA] p-4 text-base leading-normal text-[#333] transition-transform duration-200 hover:translate-x-2 hover:border-brand-sky"
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
