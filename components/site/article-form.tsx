"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as z from "zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RichTextEditor, emptyDocJson, isEmptyDoc } from "@components/site/rich-text-editor";

const articleFormSchema = z.object({
  title: z.string().min(1, "A title is required.").max(160, "The title is at most 160 characters."),
  summary: z
    .string()
    .min(1, "A summary is required.")
    .max(280, "The summary is at most 280 characters."),
  content: z.string().refine((value) => !isEmptyDoc(value), "The article body is empty."),
  imageUrl: z.url("Enter a direct link to an image."),
});

export function ArticleForm() {
  const router = useRouter();
  const create = trpc.articles.create.useMutation();

  const form = useForm({
    defaultValues: {
      title: "",
      summary: "",
      content: emptyDocJson(),
      imageUrl: "",
    },
    validators: { onSubmit: articleFormSchema },
    onSubmit: async ({ value }) => {
      try {
        const article = await create.mutateAsync(value);
        toast.success("Article submitted for review.");
        router.push(article ? `/articles/${article.id}` : "/articles");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "The article was not saved.");
      }
    },
  });

  return (
    <form
      className="rounded-lg border border-border bg-card p-8 shadow-sm max-md:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field name="title">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  maxLength={160}
                  aria-invalid={isInvalid}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <FieldDescription>{field.state.value.length} / 160</FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="summary">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Summary</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  maxLength={280}
                  aria-invalid={isInvalid}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <FieldDescription>{field.state.value.length} / 280</FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="imageUrl">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Image URL</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="url"
                  placeholder="https://"
                  aria-invalid={isInvalid}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <FieldDescription>
                  Paste a direct link to an image; it becomes the banner of the article.
                </FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="content">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel>Article</FieldLabel>
                <RichTextEditor value={field.state.value} onChange={field.handleChange} />
                <FieldDescription>
                  Images are inserted by pasting a direct link; uploads are not supported.
                </FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <div className="mt-8 flex justify-end gap-3">
            <Button type="button" variant="outline" size="lg" onClick={() => router.push("/articles")}>
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={isSubmitting || create.isPending}>
              {isSubmitting || create.isPending ? "Submitting…" : "Submit for review"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
