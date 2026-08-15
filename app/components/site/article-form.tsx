"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { trpc } from "@/lib/trpc";

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
    <Card className="mx-auto max-w-2xl">
      <CardContent className="pt-6">
        <form
          className="space-y-4"
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
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input required maxLength={160} {...field("title")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Input required maxLength={280} {...field("summary")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input required type="url" placeholder="https://" {...field("imageUrl")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Article</Label>
            <Textarea required rows={14} {...field("content")} />
          </div>

          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Submitting…" : "Submit for review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
