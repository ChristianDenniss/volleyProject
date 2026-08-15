import type { Metadata } from "next";
import { PageHeader, Section } from "@components/site/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";

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
    <>
      <PageHeader
        title="Privacy policy"
        description="How this platform collects, uses and protects your information. Using the service means you agree to it."
      />
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          {SECTIONS.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
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
