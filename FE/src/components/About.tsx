/**
 * About — the static overview of what the Volleyball 4.2 platform does, grouped into sections for league management, statistics, community features, admin tools and getting started.
 * The content is declared as an `ABOUT_SECTIONS` array of title + intro + bullet list, so adding or reordering a section is a data edit rather than a markup one.
 * Lives in `components/`; routed at /about.
 */
import SEO from "@/components/SEO";
import PageContainer from "@/components/ui/layout/PageContainer";
import PageHeader from "@/components/ui/layout/PageHeader";
import Prose from "@/components/ui/misc/Prose";

interface AboutSection {
  title: string;
  intro: string;
  items: string[];
}

const ABOUT_SECTIONS: AboutSection[] = [
  {
    title: "League Management",
    intro: "Our platform provides a complete ecosystem for competitive volleyball:",
    items: [
      "Comprehensive team management and roster tracking",
      "Detailed season organization and scheduling",
      "Real-time game statistics and performance metrics",
      "Player profiles with career statistics and achievements",
      "Automated award tracking and recognition system",
    ],
  },
  {
    title: "Statistical Analysis",
    intro: "We provide in-depth statistical tracking for every aspect of the game:",
    items: [
      "Advanced player performance metrics",
      "Team statistics and historical data",
      "Season-by-season comparisons",
      "Career progression tracking",
      "Real-time game statistics",
    ],
  },
  {
    title: "Community Features",
    intro: "Stay connected with the volleyball community through our integrated features:",
    items: [
      "News articles and game highlights",
      "Team and player profiles",
      "Match schedules and results",
      "Community announcements and updates",
      "Direct integration with our Discord community",
    ],
  },
  {
    title: "Administrative Tools",
    intro: "Our platform includes powerful tools for league administration:",
    items: [
      "User role management and permissions",
      "Content moderation and approval system",
      "Team and player registration management",
      "Game result verification and validation",
      "Comprehensive data management system",
    ],
  },
  {
    title: "Getting Started",
    intro: "Join our community today by:",
    items: [
      "Creating an account to access all features",
      "Joining our Discord server for community updates",
      "Exploring the Roblox game to start playing",
      "Checking out our teams and seasons pages",
      "Reading our latest articles and news",
    ],
  },
];

export default function About() {
  return (
    <PageContainer width="narrow">
      <SEO
        title="About"
        description="Learn about Volleyball 4.2 and the Roblox Volleyball League platform for teams, players, and fans."
        url="https://volleyball4-2.com/about"
      />

      <PageHeader
        title="About Volleyball 4.2"
        subtitle="Welcome to the official platform for Volleyball 4.2, the pinnacle competitive volleyball experience on Roblox. Our platform serves as the central hub for the Roblox Volleyball League (RVL), providing comprehensive tools for players, teams, and fans."
      />

      <Prose>
        {ABOUT_SECTIONS.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.intro}</p>
            <ul>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </Prose>
    </PageContainer>
  );
}
