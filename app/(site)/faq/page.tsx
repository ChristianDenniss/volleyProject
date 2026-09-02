import type { Metadata } from "next";
import Link from "next/link";

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
    <div className="mx-auto w-[90%] p-8 max-md:w-full max-md:p-4">
      <header className="mb-12 text-center">
        <h1 className="mb-4 text-[2.5rem] font-bold text-brand-navy max-md:text-[2rem]">
          Frequently Asked Questions
        </h1>
        <p className="mx-auto max-w-[800px] text-[1.1rem] leading-relaxed text-[#6b7280] max-md:text-base">
          Answers to common questions about RVL, plus quick links to the pages people look for.
        </p>
      </header>

      <div className="flex flex-col gap-12">
        <section>
          <h2 className="mb-6 text-[1.75rem] font-semibold text-brand-navy">Quick Links</h2>
          <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(350px,1fr))] max-md:grid-cols-1 max-md:gap-4">
            {LINKS.map((link) => {
              const content = (
                <>
                  <span className="mr-4 flex size-[50px] shrink-0 items-center justify-center rounded-[10px] bg-brand-sky text-xl text-brand-navy transition-all duration-300 group-hover:scale-105 group-hover:bg-brand-navy group-hover:text-white max-md:size-[45px] max-md:text-[1.1rem]">
                    {link.external ? "\u2197" : "\u2192"}
                  </span>
                  <span className="flex-1">
                    <span className="mb-2 block text-[1.1rem] font-semibold text-brand-navy max-md:text-base">
                      {link.title}
                    </span>
                    <span className="block text-[0.9rem] leading-snug text-[#6b7280] max-md:text-[0.85rem]">
                      {link.description}
                    </span>
                  </span>
                </>
              );

              const className =
                "group relative flex items-center rounded-lg border border-[#e5e7eb] bg-white p-6 text-inherit no-underline transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-sky hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)] max-md:p-5";

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

        <section>
          <h2 className="mb-8 text-[1.75rem] font-semibold text-brand-navy">Questions</h2>
          {GROUPS.map((group) => (
            <div key={group.category} className="mb-10">
              <h3 className="mb-4 border-b-2 border-brand-sky pb-2 text-xl font-semibold text-brand-navy max-md:text-[1.1rem]">
                {group.category}
              </h3>
              <div className="flex flex-col gap-2">
                {group.items.map((item) => (
                  <details
                    key={item.question}
                    className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white transition-all duration-300 hover:border-brand-sky hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-base font-medium text-brand-navy transition-colors duration-300 marker:hidden hover:bg-[#f8fafc] max-md:p-4 max-md:text-[0.95rem]">
                      <span className="mr-4 flex-1">{item.question}</span>
                      <span aria-hidden="true" className="text-[0.875rem] text-[#6b7280]">
                        +
                      </span>
                    </summary>
                    <div className="border-t border-[#e5e7eb] bg-[#f8fafc] px-5 pb-5 pt-5 text-[0.95rem] leading-relaxed text-[#4b5563] max-md:px-4 max-md:pb-4 max-md:text-[0.9rem]">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
