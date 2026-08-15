import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Section } from "@components/site/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@components/ui/card";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to the questions we are asked most about the Roblox Volleyball League.",
};

const GROUPS = [
  {
    category: "General questions",
    items: [
      {
        question: "What is RVL?",
        answer:
          "RVL (Roblox Volleyball League) is a competitive volleyball league within Roblox based in the game Volleyball 4.2. We host regular seasons, tournaments and events for players to compete, improve and prove their skills.",
      },
      {
        question: "How do I join RVL?",
        answer:
          "Press the join button on our Discord server to take part in the community and stay updated on current events.",
      },
      {
        question: "How do I sign my team up for RVL?",
        answer:
          "Team signups are announced through our Discord server when new seasons start, and signup forms are posted on this site. Check the announcements channel for registration periods and requirements.",
      },
      {
        question: "How do I contribute to RVL?",
        answer:
          "Apply for staff positions, help moderate our Discord, create content, stream matches, or simply be an active and positive community member.",
      },
      {
        question: "When do seasons start and end?",
        answer:
          "A season usually runs a minimum of ten weeks with about a month between seasons. The seasons page carries the current and upcoming dates.",
      },
    ],
  },
  {
    category: "Applications and staff",
    items: [
      {
        question: "How does the application process work?",
        answer:
          "Applications are reviewed by the administration team, mainly by the staff member in charge of the division you applied for. We look for dedicated, responsible people who contribute positively to the league, and you are contacted on Discord if your application is accepted.",
      },
      {
        question: "How do I know if my application was accepted?",
        answer:
          "You will be contacted through the RVL Discord server, so stay in it and keep your contact information accurate.",
      },
      {
        question: "Why are some applications closed?",
        answer:
          "A position closes when we have enough people for it, or while we restructure a team. Check back, since positions reopen.",
      },
    ],
  },
  {
    category: "Rules and guidelines",
    items: [
      {
        question: "What are the game rules?",
        answer:
          "The game follows standard volleyball rules with adaptations for the Roblox platform. Fair play and sportsmanship are expected, and violations are punished. Detailed rules live in our Discord server.",
      },
      {
        question: "What are the Discord server rules?",
        answer:
          "Our community guidelines promote respect, inclusivity and positive interaction. The rules channel in Discord has the detail. Violations may lead to warnings or removal.",
      },
    ],
  },
  {
    category: "Technical",
    items: [
      {
        question: "How are player statistics tracked?",
        answer:
          "Statistics are recorded manually during or after official matches using our stat tracking guidelines, then stored in the league database. They cover kills, assists, blocks and many other volleyball metrics.",
      },
      {
        question: "How do I report issues or bugs?",
        answer:
          "Use the support channel in our Discord server, the contact page on this site, or reach the technical team directly.",
      },
      {
        question: "Why can I not see or type in channels when I am verified?",
        answer:
          "This usually means only one verification bot was completed. Finish verification with every required bot; the verification channel has the instructions.",
      },
      {
        question: "What is Bloxlink?",
        answer:
          "Bloxlink is a Discord bot that links your Discord account to your Roblox account for verification.",
      },
      {
        question: "What is DC Verified?",
        answer:
          "DC Verified confirms a Discord account is legitimate rather than a bot or a throwaway. It is one of the verification steps for reaching our channels, and it keeps alts out of the league.",
      },
      {
        question: "How do I verify?",
        answer:
          "Type /verify in the verification channel, wait for the commands to load, pick the bot you want to verify with and follow the prompts. The process is the same either way.",
      },
      {
        question: "Why can I not verify?",
        answer:
          "Check that your Discord account is legitimate, your Roblox account is active and you followed every instruction. Contact a moderator if it still fails.",
      },
    ],
  },
];

const LINKS = [
  {
    title: "Join Discord",
    description: "Connect with the community, get help and stay updated on events.",
    href: "https://discord.gg/volleyball",
    external: true,
  },
  {
    title: "Play Volleyball 4.2",
    description: "Play the official game and experience competitive volleyball matches.",
    href: "https://www.roblox.com/games/3840352284/Volleyball-4-2",
    external: true,
  },
  {
    title: "Staff applications",
    description: "Apply for staff, media, officiating and management positions.",
    href: "/applications",
    external: false,
  },
  {
    title: "About RVL",
    description: "Learn more about the league, its history and its mission.",
    href: "/about",
    external: false,
  },
  {
    title: "Privacy policy",
    description: "Understand how we handle your data and information.",
    href: "/privacy-policy",
    external: false,
  },
  {
    title: "Contact us",
    description: "Reach the team for support, questions or feedback.",
    href: "/contact",
    external: false,
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHeader
        title="Frequently asked questions"
        description="Answers to common questions about RVL, plus quick links to the pages people look for."
      />

      <Section title="Quick links">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LINKS.map((link) => (
            <Card key={link.title}>
              <CardHeader>
                <CardTitle className="text-base">
                  {link.external ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                      {link.title}
                    </a>
                  ) : (
                    <Link href={link.href}>{link.title}</Link>
                  )}
                </CardTitle>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Questions">
        <div className="space-y-8">
          {GROUPS.map((group) => (
            <div key={group.category}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-brand-steel">
                {group.category}
              </h3>
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                {group.items.map((item) => (
                  <details key={item.question} className="group bg-card">
                    <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium marker:hidden hover:bg-muted/60">
                      {item.question}
                    </summary>
                    <div className="px-5 pb-4 text-sm text-muted-foreground">{item.answer}</div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
