import type { Metadata } from "next";
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
    <div className="flex justify-center px-5 py-20 font-display sm:px-8">
      <div className="w-full max-w-[460px] border border-rvl-line p-8">
        <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
          Sign in
        </span>

        <h1 className="mt-4 mb-4 text-[1.9rem] font-black uppercase leading-none tracking-[-0.03em]">
          Continue with Roblox
        </h1>

        <p className="m-0 mb-8 text-[0.92rem] leading-relaxed text-rvl-ink-2">
          Roblox is the only way in. There is no password. We receive your Roblox username and
          avatar. Renaming on Roblox keeps your account, your articles and your role intact.
        </p>

        <RobloxSignIn callbackURL={callbackURL} />
      </div>
    </div>
  );
}
