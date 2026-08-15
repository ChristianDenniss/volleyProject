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
    <div className="flex justify-center bg-[#F5F7FA] px-4 pb-16">
      <div className="mx-auto mt-16 box-border w-auto min-w-[500px] max-w-[700px] rounded-xl bg-white px-8 py-10 text-center shadow-[0_8px_24px_rgba(0,0,0,0.1)] max-[420px]:min-w-0 max-[420px]:px-6 max-[420px]:py-8">
        <h2 className="mb-6 mt-0 text-[1.75rem] font-semibold tracking-wide text-brand-sky">
          Continue with Roblox
        </h2>

        <p className="mb-6 text-[0.95rem] leading-relaxed text-[#555]">
          Roblox is the only way in — there is no password. We receive your Roblox username and
          avatar. Renaming on Roblox keeps your account, your articles and your role intact.
        </p>

        <RobloxSignIn callbackURL={callbackURL} />
      </div>
    </div>
  );
}
