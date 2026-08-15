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
    <div className="flex items-center gap-2 font-sans">
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
          "cursor-pointer border-none bg-transparent p-0 text-[2rem] leading-none transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60",
          liked ? "text-[#800000]" : "text-[#e0e0e0] hover:enabled:scale-110 hover:enabled:text-[#d32f2f]",
        )}
      >
        ♥
      </button>
      <span className="text-[#555]">{likes}</span>
    </div>
  );
}
