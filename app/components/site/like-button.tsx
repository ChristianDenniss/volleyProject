"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
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
    <Button
      variant={liked ? "default" : "outline"}
      size="sm"
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
    >
      <Heart className={liked ? "size-4 fill-current" : "size-4"} />
      {likes}
    </Button>
  );
}
