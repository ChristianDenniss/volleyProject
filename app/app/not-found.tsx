import Link from "next/link";
import { Button } from "@components/ui/button";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-steel">404</p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        That page does not exist
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The link may be out of date, or the season, team, player or article it pointed at has been
        removed.
      </p>
      <Button asChild>
        <Link href="/">Back to the league</Link>
      </Button>
    </main>
  );
}
