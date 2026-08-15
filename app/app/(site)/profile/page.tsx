import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@db";
import { users } from "@server/services";
import { requireSession } from "@server/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your account and the articles you have written.",
};

export default async function ProfilePage() {
  const session = await requireSession("/profile");
  const profile = await users.profile(getDb(), session.id);
  if (!profile) notFound();

  const details: { label: string; value: string }[] = [
    { label: "Roblox username", value: profile.email },
    { label: "Role", value: profile.role },
    { label: "Articles written", value: String(profile.articleCount) },
    { label: "Joined", value: new Date(profile.createdAt).toISOString().slice(0, 10) },
    { label: "Account status", value: profile.banned ? "Banned" : "Active" },
  ];

  return (
    <div className="mx-auto my-8 grid w-[90%] gap-x-8 rounded-xl bg-white p-8 text-[#333] shadow-[0_8px_20px_rgba(0,0,0,0.05)] [grid-template-areas:'header_header''card_articles'] [grid-template-columns:1fr_1fr] max-[800px]:[grid-template-areas:'header''card''articles'] max-[800px]:[grid-template-columns:1fr]">
      <h2 className="mb-8 mt-0 text-center text-[2.25rem] font-bold text-[#4A90E2] [grid-area:header] capitalize">
        {profile.name}
      </h2>

      <div className="border-r border-[#e0e0e0] pb-4 pr-4 [grid-area:card] max-[800px]:border-b max-[800px]:border-r-0 max-[800px]:pr-0">
        <p className="mb-12 text-left text-2xl font-semibold text-[#4A90E2]">Details</p>
        {details.map((detail) => (
          <p key={detail.label} className="mx-8 mb-4 flex items-center text-base leading-relaxed max-md:mx-0">
            <strong className="mr-2 w-[200px] shrink-0 font-semibold text-brand-ink">
              {detail.label}
            </strong>
            <span className="capitalize">{detail.value}</span>
          </p>
        ))}
      </div>

      <div className="pl-4 [grid-area:articles] max-[800px]:mt-8 max-[800px]:pl-0">
        <h3 className="mb-4 mt-0 text-center text-2xl font-semibold text-[#4A90E2]">
          Your articles
        </h3>

        {profile.articles.length === 0 ? (
          <p className="my-4 text-center">
            You have not written anything yet.{" "}
            <Link href="/articles/create" className="text-[#4A90E2] hover:underline">
              Write an article
            </Link>
            .
          </p>
        ) : (
          <ul className="m-0 list-none p-0">
            {profile.articles.map((article) => (
              <li
                key={article.id}
                className="mb-4 flex justify-between gap-4 rounded-lg bg-[#b5d3ff] px-4 py-3 text-left shadow-[0_4px_12px_rgba(0,0,0,0.03)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
              >
                <Link
                  href={`/articles/${article.id}`}
                  className="text-[0.95rem] font-medium text-brand-ink no-underline hover:text-[#4A90E2]"
                >
                  {article.title}
                </Link>
                <span className="shrink-0 text-[0.8rem] text-brand-ink/70">
                  {article.approved === null
                    ? "Awaiting review"
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
  );
}
