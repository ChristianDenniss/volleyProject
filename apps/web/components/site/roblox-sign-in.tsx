export function RobloxSignIn({ callbackURL }: { callbackURL: string }) {
  const href = `/api/login/roblox?next=${encodeURIComponent(callbackURL)}`;

  return (
    <a
      href={href}
      rel="nofollow"
      className="block w-full cursor-pointer border-none bg-rvl-accent-bg px-5 py-4 text-center font-mono text-[0.72rem] font-bold uppercase tracking-[0.14em] text-rvl-on-accent no-underline transition-opacity hover:opacity-85"
    >
      Sign in with Roblox
    </a>
  );
}
