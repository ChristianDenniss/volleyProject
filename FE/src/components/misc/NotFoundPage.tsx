/**
 * NotFoundPage — the branded 404, rendered by the catch-all route in App.tsx.
 *
 * Distinct from ServiceErrorPage on purpose: nothing is broken here, so there is no refresh
 * action and no apology — just the ball out of bounds and the way back to the pages people
 * were most likely looking for.
 *
 * Lives in `components/misc/`; the only route that renders it is `path="*"`.
 */
import React from "react";
import { Link } from "react-router-dom";
import SEO from "../SEO";
import { Helmet } from "@dr.pogodin/react-helmet";
import rvlLogo from "../../images/rvlLogo.png";

/* Where a lost visitor most likely meant to go. Kept short deliberately - the navbar already
   carries the full set, and a wall of links reads as a sitemap, not a recovery. */
const DESTINATIONS: { to: string; label: string }[] = [
  { to: "/", label: "Home" },
  { to: "/teams", label: "Teams" },
  { to: "/players", label: "Players" },
  { to: "/games", label: "Games" },
  { to: "/stats", label: "Stats" },
];

/* Tailwind preflight is not loaded in this app (see styles/tailwind.css), so link chrome is
   set explicitly rather than inherited from a reset. */
const destinationLink =
  "inline-flex items-center justify-center py-2 px-4 " +
  "text-sm font-semibold no-underline text-brand-primary " +
  "bg-bg border border-accent-border rounded-sm " +
  "transition-colors duration-200 hover:bg-accent-hover-bg hover:border-accent";

const NotFoundPage: React.FC = () => (
  <>
    <SEO
      title="Page not found"
      description="That page doesn't exist on volleyball4-2.com. Head back to the league standings, teams, players and match results."
    />
    {/* A 404 should never be indexed; this overrides the index,follow that SEO sets by default. */}
    <Helmet>
      <meta name="robots" content="noindex, follow" />
    </Helmet>

    <div className="flex min-h-[60vh] items-center justify-center bg-bg-light px-6 py-16">
      <div className="flex w-full max-w-lg flex-col items-center text-center">
        <img src={rvlLogo} alt="" aria-hidden className="mb-8 h-24 w-auto -rotate-6 opacity-90" />

        <p className="m-0 font-mono text-sm tracking-[0.3em] text-text-subtle">404</p>
        <h1 className="mt-2 mb-0 text-2xl font-semibold tracking-tight text-text">That one landed out of bounds.</h1>
        <p className="mt-3 mb-0 text-sm leading-relaxed text-text-muted">
          The page you're after doesn't exist — it may have been renamed, or the link that brought you here is out of
          date.
        </p>

        <nav aria-label="Popular pages" className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {DESTINATIONS.map(destination => (
            <Link key={destination.to} to={destination.to} className={destinationLink}>
              {destination.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  </>
);

export default NotFoundPage;
