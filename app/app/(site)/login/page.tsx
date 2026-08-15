import type { Metadata } from "next";
import { PageHeader, Section } from "@components/site/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { RobloxSignIn } from "@components/site/roblox-sign-in";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the Volleyball 4-2 league with your Roblox account.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const callbackURL = next && next.startsWith("/") ? next : "/";

  return (
    <>
      <PageHeader title="Sign in" description="Roblox is the only way in — there is no password." />
      <Section>
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Continue with Roblox</CardTitle>
            <CardDescription>
              We receive your Roblox username and avatar. Renaming on Roblox keeps your account,
              your articles and your role intact.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RobloxSignIn callbackURL={callbackURL} />
          </CardContent>
        </Card>
      </Section>
    </>
  );
}
