"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export function TeamProfileEditor({
  teamId,
  teamName,
  logoUrl,
  description,
}: {
  teamId: number;
  teamName: string;
  logoUrl: string | null;
  description: string | null;
}) {
  const router = useRouter();
  const update = trpc.teams.updateProfile.useMutation();
  const [open, setOpen] = useState(false);
  const [nextLogo, setNextLogo] = useState(logoUrl ?? "");
  const [nextDescription, setNextDescription] = useState(description ?? "");

  async function save() {
    try {
      const logo = nextLogo.trim();
      await update.mutateAsync({
        id: teamId,
        patch: {
          logoUrl: logo.length > 0 ? logo : null,
          description: nextDescription.trim().length > 0 ? nextDescription.trim() : null,
        },
      });
      toast.success(`${teamName} updated.`);
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the team.");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer border border-rvl-line bg-transparent px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-dim transition-colors hover:border-rvl-accent-soft hover:text-rvl-accent"
      >
        Edit logo & description
      </button>
    );
  }

  return (
    <div className="w-full max-w-xl border border-rvl-line bg-rvl-panel p-5">
      <h2 className="m-0 mb-4 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
        Team profile
      </h2>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="team-logo-url">Logo URL</FieldLabel>
          <Input
            id="team-logo-url"
            type="url"
            value={nextLogo}
            onChange={(event) => setNextLogo(event.target.value)}
            placeholder="https://…"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="team-description">Description</FieldLabel>
          <Textarea
            id="team-description"
            value={nextDescription}
            maxLength={500}
            rows={4}
            onChange={(event) => setNextDescription(event.target.value)}
            placeholder="A short blurb about the team."
          />
        </Field>
      </FieldGroup>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={() => void save()} disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setNextLogo(logoUrl ?? "");
            setNextDescription(description ?? "");
            setOpen(false);
          }}
          disabled={update.isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
