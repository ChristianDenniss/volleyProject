const CHAPTER_2_BANNERS: Record<number, string> = {
  1: "/images/bannerCh2S1.png",
  2: "/images/bannerCh2S2.png",
  3: "/images/bannerCh2S3.png",
};

export function seasonBanner(seasonNumber: number, image?: string | null) {
  return image || CHAPTER_2_BANNERS[seasonNumber] || "/images/callToAction.png";
}
