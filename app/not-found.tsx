import Link from "next/link";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-start justify-center gap-5 bg-rvl-ground px-5 font-display text-rvl-ink sm:px-8 xl:px-14">
      <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
        404
      </span>
      <h1 className="m-0 text-[2.4rem] font-black uppercase leading-[0.95] tracking-[-0.035em] sm:text-[3rem]">
        That page does not exist
      </h1>
      <p className="m-0 max-w-[52ch] text-[1rem] text-rvl-ink-2">
        The link may be out of date, or the season, team, player or article it pointed at has been
        removed.
      </p>
      <Link
        href="/"
        className="mt-2 bg-rvl-accent-bg px-6 py-3.5 font-mono text-[0.72rem] font-bold uppercase tracking-[0.14em] text-rvl-on-accent no-underline transition-opacity hover:opacity-85"
      >
        Back to the league
      </Link>
    </main>
  );
}
