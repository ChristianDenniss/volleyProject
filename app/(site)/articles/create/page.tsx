import type { Metadata } from "next";
import { ArticleForm } from "@components/site/article-form";
import { PageHeader } from "@components/site/page-header";

export const metadata: Metadata = {
  title: "Write an article",
  description: "Submit a match report or league news article for review.",
};

export default function CreateArticlePage() {
  return (
    <div>
      <PageHeader
        eyebrow="League desk"
        title="Write an article"
        description="Submitted articles wait for an administrator to approve them before they appear on the site."
      />

      <div className="px-5 py-12 sm:px-8 xl:px-14">
        <ArticleForm />
      </div>
    </div>
  );
}
