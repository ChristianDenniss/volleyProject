import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@components/site/page-header";

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
    <div className="font-display">
      <PageHeader
        eyebrow="Help desk"
        title="Frequently asked questions"
        description="How the league runs, how to join it, and where to go when something breaks."
      />

      <section className="grid grid-cols-1 gap-8 border-b border-rvl-line px-5 py-12 sm:px-8 md:grid-cols-[210px_1fr] md:gap-14 xl:px-14">
        <div>
          <h2 className="m-0 mb-3 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
            Quick links
          </h2>
          <p className="m-0 text-[0.84rem] text-rvl-dim">The pages people ask for most.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {LINKS.map((link) => {
              const content = (
                <>
                  <span className="flex size-9 shrink-0 items-center justify-center border border-rvl-line font-mono text-[0.85rem] text-rvl-dim transition-colors group-hover:border-rvl-accent-soft group-hover:text-rvl-accent">
                    {link.external ? "\u2197" : "\u2192"}
                  </span>
                  <span className="flex-1">
                    <span className="block text-[0.98rem] font-semibold">{link.title}</span>
                    <span className="mt-1 block text-[0.84rem] leading-snug text-rvl-ink-2">
                      {link.description}
                    </span>
                  </span>
                </>
              );

              const className =
                "group flex items-start gap-4 border border-rvl-line p-5 text-inherit no-underline transition-colors hover:border-rvl-accent-soft";

              return link.external ? (
                <a
                  key={link.title}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {content}
                </a>
              ) : (
                <Link key={link.title} href={link.href} className={className}>
                  {content}
                </Link>
              );
            })}
        </div>
      </section>

      {GROUPS.map((group) => (
        <section
          key={group.category}
          className="grid grid-cols-1 gap-8 border-b border-rvl-line px-5 py-12 sm:px-8 md:grid-cols-[210px_1fr] md:gap-14 xl:px-14"
        >
          <div>
            <h2 className="m-0 mb-3 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
              {group.category}
            </h2>
            <p className="m-0 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-dim">
              {group.items.length} questions
            </p>
          </div>

          <div className="border-t border-rvl-line">
            {group.items.map((item) => (
              <details key={item.question} className="group border-b border-rvl-line">
                <summary className="flex cursor-pointer list-none items-center gap-5 py-5 text-[1rem] font-semibold transition-colors marker:hidden hover:text-rvl-accent [&::-webkit-details-marker]:hidden">
                  <span className="flex-1">{item.question}</span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 font-mono text-[1.1rem] text-rvl-dim transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="m-0 max-w-[70ch] pb-6 text-[0.94rem] leading-relaxed text-rvl-ink-2">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
