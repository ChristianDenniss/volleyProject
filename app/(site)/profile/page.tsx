import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@server/session";
import { api } from "@server/trpc/server";
import { PageHeader, PageMetric } from "@components/site/page-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your account and the articles you have written.",
};

export default async function ProfilePage() {
  await requireSession("/profile");
  const profile = await (await api()).users.me();
  if (!profile) notFound();

  const details: { label: string; value: string }[] = [
    { label: "Roblox username", value: profile.email },
    { label: "Role", value: profile.role },
    { label: "Articles written", value: String(profile.articleCount) },
    { label: "Joined", value: new Date(profile.createdAt).toISOString().slice(0, 10) },
    { label: "Account status", value: profile.banned ? "Banned" : "Active" },
  ];

  return (
    <div className="font-display">
      <PageHeader
        eyebrow="Account"
        title={profile.name}
        description="Your account on the league platform and everything you have submitted to the desk."
        actions={
          <Link
            href="/articles/create"
            className="bg-rvl-accent-bg px-5 py-3 font-mono text-[0.7rem] font-bold uppercase tracking-[0.14em] text-rvl-on-accent no-underline transition-opacity hover:opacity-85"
          >
            Write an article
          </Link>
        }
        meta={
          <>
            <PageMetric label="Role" value={profile.role} />
            <PageMetric label="Articles" value={profile.articleCount} />
            <PageMetric label="Status" value={profile.banned ? "Banned" : "Active"} />
          </>
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
            Your articles
          </h2>
          <p className="m-0 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-dim">
            {profile.articles.length} submitted
          </p>
        </div>

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
      </section>
    </div>
  );
}
