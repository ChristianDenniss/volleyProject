import type { Metadata } from "next";
import { ArticleForm } from "@components/site/article-form";

export const metadata: Metadata = {
  title: "Write an article",
  description: "Submit a match report or league news article for review.",
};

export default function CreateArticlePage() {
  return (
    <div className="mx-auto max-w-[1400px] p-6">
      <h1 className="mb-6 text-[2rem] font-bold text-[#222]">Write an article</h1>

      <div className="mb-6 rounded border border-[#ffeeba] bg-[#fff3cd] px-4 py-3 text-[#856404]">
        Submitted articles wait for an administrator to approve them before they appear on the site.
      </div>

      <ArticleForm />
    </div>
  );
}
