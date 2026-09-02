"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

export function LikeButton({
  articleId,
  initialLiked,
  initialLikes,
  signedIn,
}: {
  articleId: number;
  initialLiked: boolean;
  initialLikes: number;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);

  const like = trpc.articles.like.useMutation();
  const unlike = trpc.articles.unlike.useMutation();
  const pending = like.isPending || unlike.isPending;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label={liked ? "Unlike this article" : "Like this article"}
        disabled={pending}
        onClick={async () => {
          if (!signedIn) {
            router.push(`/login?next=${encodeURIComponent(`/articles/${articleId}`)}`);
            return;
          }
          try {
            const result = liked
              ? await unlike.mutateAsync({ id: articleId })
              : await like.mutateAsync({ id: articleId });
            setLiked(result.liked);
            setLikes(result.likes);
          } catch {
            toast.error("That like did not go through.");
          }
        }}
        className={cn(
          "flex cursor-pointer items-center gap-2.5 border bg-transparent px-4 py-2.5 font-mono text-[0.7rem] uppercase tracking-[0.14em] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          liked
            ? "border-rvl-accent-soft text-rvl-accent"
            : "border-rvl-line text-rvl-dim hover:enabled:border-rvl-accent-soft hover:enabled:text-rvl-accent",
        )}
      >
        <span className="text-[0.95rem] leading-none">♥</span>
        {liked ? "Liked" : "Like"}
      </button>
      <span className="font-mono text-[0.8rem] tabular-nums text-rvl-dim">{likes}</span>
    </div>
  );
}
