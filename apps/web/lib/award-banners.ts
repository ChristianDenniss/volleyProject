export const AWARD_BANNERS: Record<string, string> = {
  MVP: "/images/awards/mvp.png",
  "Best Spiker": "/images/awards/best-spiker.png",
  "Best Server": "/images/awards/best-server.png",
  "Best Blocker": "/images/awards/best-blocker.png",
  "Best Setter": "/images/awards/best-setter.png",
  MIP: "/images/awards/mip.png",
  "Best Aper": "/images/awards/best-aper.png",
  FMVP: "/images/awards/fmvp.png",
  DPOS: "/images/awards/dpos.png",
  "Best Receiver": "/images/awards/best-receiver.png",
  "LuvLate Award": "/images/awards/community-recognition.png",
};

export function awardBanner(type: string, imageUrl?: string | null) {
  return AWARD_BANNERS[type] ?? imageUrl ?? null;
}
