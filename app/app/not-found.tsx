import Link from "next/link";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-steel">404</p>
      <h1 className="text-[3rem] font-extrabold text-brand-navy max-md:text-[2rem]">
        That page does not exist
      </h1>
      <p className="max-w-md text-base text-[#5d6673]">
        The link may be out of date, or the season, team, player or article it pointed at has been
        removed.
      </p>
      <Link
        href="/"
        className="rounded-md bg-brand-navy px-6 py-3 font-semibold text-white no-underline transition-colors duration-200 hover:bg-brand-steel"
      >
        Back to the league
      </Link>
    </main>
  );
}
