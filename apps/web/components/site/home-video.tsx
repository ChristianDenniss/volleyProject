"use client";

import { useEffect, useRef, useState } from "react";

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
}

interface YouTubeApi {
  Player: new (id: string, options: Record<string, unknown>) => YouTubePlayer;
}

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function HomeVideo({ videoId }: { videoId: string }) {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const containerRef = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const createPlayer = () => {
      if (!window.YT?.Player) return;
      playerRef.current = new window.YT.Player("yt-player", {
        videoId,
        playerVars: { modestbranding: 1, rel: 0, controls: 1, showinfo: 0, autoplay: 0, mute: 1 },
        events: { onReady: () => setReady(true) },
      });
    };

    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = createPlayer;
    } else if (window.YT?.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;
    }

    return () => {
      delete window.onYouTubeIframeAPIReady;
      playerRef.current?.destroy();
      playerRef.current = null;
      setReady(false);
    };
  }, [videoId]);

  useEffect(() => {
    const player = playerRef.current;
    if (!containerRef.current || !ready || !player) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            player.playVideo();
          } else {
            player.pauseVideo();
          }
        });
      },
      { threshold: [0, 0.6, 1] },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [ready]);

  return (
    <section
      ref={containerRef}
      aria-label="Volleyball promotional video"
      className="relative w-full overflow-hidden pt-[56.25%]"
    >
      <div id="yt-player" className="absolute! inset-0 h-full! w-full!" />
    </section>
  );
}
