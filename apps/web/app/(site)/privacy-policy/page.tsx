import type { Metadata } from "next";
import { PageHeader } from "@components/site/page-header";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What the Volleyball 4-2 league platform collects, how it is used, and what rights you have over it.",
};

const SECTIONS = [
  {
    title: "What we collect",
    items: [
      "Account information: the Roblox account you sign in with, its username and avatar image",
      "Profile data: your role on this site, team associations and player statistics",
      "Game data: match results, team statistics, player performance metrics and season records",
      "Content: articles, team information, game highlights and anything else you submit",
    ],
  },
  {
    title: "How we use it",
    items: [
      "To authenticate accounts and decide what each role may reach",
      "To maintain rosters, schedules and season information",
      "To produce match statistics, player rankings and standings",
      "To publish articles and highlights submitted by the community",
      "To operate the administrative tools that run the league",
    ],
  },
  {
    title: "Sign-in and security",
    items: [
      "Signing in goes through Roblox OAuth; this site never sees or stores a password",
      "Roblox does not return an email address, so the account record holds your Roblox username",
      "Sessions are held in a signed, HTTP-only cookie and expire on their own",
      "Access to administrative data is restricted by role on every write",
    ],
  },
  {
    title: "Roles",
    items: [
      "Users can view public content and manage their own profile and articles",
      "Admins can manage seasons, teams, players, games, stats, awards, matches and articles",
      "Superadmins can additionally change the role of any account",
    ],
  },
  {
    title: "Third parties",
    items: [
      "Roblox, for sign-in and avatar images",
      "Cloudflare, which hosts the site and its database",
      "Challonge, when a tournament bracket is imported by an administrator",
    ],
  },
  {
    title: "Your rights",
    items: [
      "Ask what is stored against your account",
      "Correct your profile information",
      "Request deletion of your account and the content attached to it",
      "Ask for an export of your data",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="font-display">
      <PageHeader
        eyebrow="Legal"
        title="Privacy policy"
        description="What this platform collects, how it is used, and what you can ask us to do with it. Using the service means you agree to it."
      />

      {SECTIONS.map((section) => (
        <section
          key={section.title}
          className="grid grid-cols-1 gap-8 border-b border-rvl-line px-5 py-12 sm:px-8 md:grid-cols-[210px_1fr] md:gap-14 xl:px-14"
        >
          <h2 className="m-0 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
            {section.title}
          </h2>

          <ul className="m-0 max-w-[75ch] list-none border-t border-rvl-line p-0">
            {section.items.map((item) => (
              <li
                key={item}
                className="border-b border-rvl-line py-4 text-[0.98rem] leading-relaxed text-rvl-ink-2"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="m-0 px-5 py-10 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-dim sm:px-8 xl:px-14">
        Questions about this policy? Reach us through the contact page.
      </p>
    </div>
  );
}
