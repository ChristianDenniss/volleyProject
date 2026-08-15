import type { Metadata } from "next";
import { PageHeader, Section } from "@components/site/page-header";
import { ArticleForm } from "@components/site/article-form";

export const metadata: Metadata = {
  title: "Write an article",
  description: "Submit a match report or league news article for review.",
};

export default function CreateArticlePage() {
  return (
    <>
      <PageHeader
        title="Write an article"
        description="Submitted articles wait for an administrator to approve them before they appear on the site."
      />
      <Section>
        <ArticleForm />
      </Section>
    </>
  );
}
