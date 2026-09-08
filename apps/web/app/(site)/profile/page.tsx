import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { requireSession } from "@server/session";
import { api } from "@server/trpc/server";
import { PageHeader, PageMetric } from "@components/site/page-header";
import { ProfileSettings } from "@components/site/profile-settings";

const ROLE_LABELS = {
  streamed: "Streamed",
  reffed: "Reffed",
  commentated: "Commentated",
} as const;

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your account and league contributions.",
};

export default async function ProfilePage() {
  await requireSession("/profile");
  const profile = await (await api()).users.me();
  if (!profile) notFound();

  const details: { label: string; value: string }[] = [
    { label: "Roblox username", value: profile.email },
    { label: "Role", value: profile.role },
    { label: "Joined", value: new Date(profile.createdAt).toISOString().slice(0, 10) },
    { label: "Account status", value: profile.banned ? "Banned" : "Active" },
  ];
  const linked = profile.player;

  return (
    <div className="font-display">
      <PageHeader
        eyebrow="Account"
        title={profile.name}
        description="Your account on the league platform and the work you have logged."
        meta={
          <img
            src={profile.image ?? "/images/pfpLogo.png"}
            alt=""
            className="size-40 border border-rvl-line object-cover sm:size-52 lg:size-64"
          />
        }
      />

      <section className="grid grid-cols-1 gap-8 border-b border-rvl-line px-5 py-12 sm:px-8 md:grid-cols-[210px_1fr] md:gap-14 xl:px-14">
        <h2 className="m-0 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
          Details
        </h2>

        <dl className="m-0 grid grid-cols-1 border-t border-rvl-line">
          {details.map((detail) => (
            <div
              key={detail.label}
              className="flex flex-wrap items-baseline gap-x-8 gap-y-1 border-b border-rvl-line py-4"
            >
              <dt className="w-[190px] shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-rvl-dim">
                {detail.label}
              </dt>
              <dd className="m-0 text-[0.98rem] capitalize">{detail.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="grid grid-cols-1 gap-8 border-b border-rvl-line px-5 py-12 sm:px-8 md:grid-cols-[210px_1fr] md:gap-14 xl:px-14">
        <div>
          <h2 className="m-0 mb-3 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
            Connected player
          </h2>
          <p className="m-0 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-dim">
            Linked from your Roblox account
          </p>
        </div>

        {linked ? (
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-b border-rvl-line py-4">
            <p className="m-0 flex flex-wrap items-baseline gap-x-2">
              <span className="text-rvl-ink-2">Username:</span>
              <Link
                href={`/players/${linked.id}`}
                className="inline-flex items-center gap-1 text-[0.98rem] font-semibold capitalize text-rvl-ink no-underline transition-colors hover:text-rvl-accent"
              >
                {linked.name}
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </Link>
            </p>
            <p className="m-0 flex flex-wrap items-baseline gap-x-2">
              <span className="text-rvl-ink-2">Position:</span>
              <span className="text-[0.98rem] capitalize">{linked.position || "N/A"}</span>
            </p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
              <span className="text-rvl-ink-2">Teams:</span>
              {linked.teams.length === 0 ? (
                <span className="text-[0.98rem]">No teams yet</span>
              ) : (
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {linked.teams.map((team) => (
                    <li key={team.id}>
                      <Link
                        href={`/teams/${encodeURIComponent(team.name)}`}
                        className="inline-flex items-center gap-1 border border-rvl-line px-3 py-1.5 font-mono text-[0.64rem] uppercase tracking-[0.12em] text-rvl-ink-2 no-underline transition-colors hover:border-rvl-accent-soft hover:text-rvl-accent"
                      >
                        {team.name}
                        {team.seasonNumber ? ` · S${team.seasonNumber}` : ""}
                        <ArrowUpRight className="size-3" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <p className="m-0 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-rvl-dim">
            No player linked to this account yet.
          </p>
        )}
      </section>

      <section className="grid grid-cols-1 gap-8 border-b border-rvl-line px-5 py-12 sm:px-8 md:grid-cols-[210px_1fr] md:gap-14 xl:px-14">
        <div>
          <h2 className="m-0 mb-3 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
            Settings
          </h2>
          <p className="m-0 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-dim">
            Appearance and session
          </p>
        </div>

        <ProfileSettings />
      </section>

      <section className="grid grid-cols-1 gap-8 border-b border-rvl-line px-5 py-12 sm:px-8 md:grid-cols-[210px_1fr] md:gap-14 xl:px-14">
        <div>
          <h2 className="m-0 mb-3 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
            Contributions
          </h2>
          <p className="m-0 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-dim">
            Games and articles logged to this account
          </p>
        </div>

        <div className="flex flex-col gap-10">
          <div className="flex flex-wrap gap-8 font-mono">
            <PageMetric label="Games streamed" value={profile.contributions.streamed} />
            <PageMetric label="Games reffed" value={profile.contributions.reffed} />
            <PageMetric label="Games commentated" value={profile.contributions.commentated} />
            <PageMetric label="Approved articles" value={profile.contributions.articlesApproved} />
            <PageMetric label="Total articles" value={profile.contributions.articlesTotal} />
          </div>

          <div>
            <h3 className="m-0 mb-4 font-mono text-[0.62rem] font-bold uppercase tracking-[0.2em] text-rvl-dim">
              Games
            </h3>
            {profile.staff.length === 0 ? (
              <p className="m-0 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-rvl-dim">
                No games logged yet.
              </p>
            ) : (
              <ul className="m-0 list-none border-t border-rvl-line p-0">
                {profile.staff.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-wrap items-center gap-4 border-b border-rvl-line py-4"
                  >
                    <Link
                      href={`/games/${entry.gameId}`}
                      className="text-[0.98rem] font-semibold capitalize text-rvl-ink no-underline transition-colors hover:text-rvl-accent"
                    >
                      {entry.gameName ?? `Game ${entry.gameId}`}
                    </Link>
                    <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-rvl-dim">
                      {entry.date}
                    </span>
                    <span className="ml-auto font-mono text-[0.62rem] uppercase tracking-[0.16em] text-rvl-accent">
                      {ROLE_LABELS[entry.role]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="m-0 mb-4 font-mono text-[0.62rem] font-bold uppercase tracking-[0.2em] text-rvl-dim">
              Articles
            </h3>
            {profile.articles.length === 0 ? (
              <p className="m-0 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-rvl-dim">
                Nothing written yet.
              </p>
            ) : (
              <ul className="m-0 list-none border-t border-rvl-line p-0">
                {profile.articles.map((article) => (
                  <li
                    key={article.id}
                    className="flex flex-wrap items-center gap-4 border-b border-rvl-line py-4"
                  >
                    <Link
                      href={`/articles/${article.id}`}
                      className="text-[0.98rem] font-semibold text-rvl-ink no-underline transition-colors hover:text-rvl-accent"
                    >
                      {article.title}
                    </Link>
                    <span
                      className={
                        article.approved
                          ? "ml-auto font-mono text-[0.62rem] uppercase tracking-[0.16em] text-rvl-mint"
                          : "ml-auto font-mono text-[0.62rem] uppercase tracking-[0.16em] text-rvl-dim"
                      }
                    >
                      {article.approved === null
                        ? "Pending approval"
                        : article.approved
                          ? "Published"
                          : "Rejected"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
