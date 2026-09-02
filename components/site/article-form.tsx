"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const inputClass =
  "w-full rounded border border-[#ddd] p-3 text-base focus:border-brand-navy focus:outline-none";

export function ArticleForm() {
  const router = useRouter();
  const create = trpc.articles.create.useMutation();
  const [form, setForm] = useState({ title: "", summary: "", content: "", imageUrl: "" });

  const field = (key: keyof typeof form) => ({
    id: key,
    value: form[key],
    onChange: (event: { target: { value: string } }) =>
      setForm((current) => ({ ...current, [key]: event.target.value })),
  });

  return (
    <form
      className="rounded-lg bg-white p-8 shadow-[0_2px_4px_rgba(0,0,0,0.1)] max-md:p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        try {
          const article = await create.mutateAsync(form);
          toast.success("Article submitted for review.");
          router.push(`/articles/${article.id}`);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "The article was not saved.");
        }
      }}
    >
      <div className="mb-6">
        <label htmlFor="title" className="mb-2 block font-medium text-[#333]">
          Title
        </label>
        <input required maxLength={160} className={inputClass} {...field("title")} />
        <div className="mt-1 flex justify-between text-sm text-[#666]">
          <span>{form.title.length} / 160</span>
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="summary" className="mb-2 block font-medium text-[#333]">
          Summary
        </label>
        <input required maxLength={280} className={inputClass} {...field("summary")} />
        <div className="mt-1 flex justify-between text-sm text-[#666]">
          <span>{form.summary.length} / 280</span>
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="imageUrl" className="mb-2 block font-medium text-[#333]">
          Image URL
        </label>
        <input required type="url" placeholder="https://" className={inputClass} {...field("imageUrl")} />
        <p className="mt-2 text-[0.9rem] text-[#666]">
          Paste a direct link to an image; it becomes the banner of the article.
        </p>
      </div>

      <div className="mb-6">
        <label htmlFor="content" className="mb-2 block font-medium text-[#333]">
          Article
        </label>
        <textarea
          required
          rows={14}
          className={`${inputClass} min-h-[200px] resize-y`}
          {...field("content")}
        />
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/articles")}
          className="cursor-pointer rounded border border-[#ddd] bg-[#f8f9fa] px-6 py-3 text-base text-[#333] transition-colors duration-200 hover:bg-[#e9ecef]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={create.isPending}
          className="cursor-pointer rounded border-none bg-brand-navy px-6 py-3 text-base text-white transition-colors duration-200 hover:enabled:bg-brand-steel disabled:cursor-not-allowed disabled:opacity-60"
        >
          {create.isPending ? "Submitting…" : "Submit for review"}
        </button>
      </div>
    </form>
  );
}
