export const APPLICATION_CATEGORY_ORDER = [
  "staff",
  "media",
  "game-officials",
  "management",
] as const;

export const APPLICATION_CATEGORY_LABELS: Record<(typeof APPLICATION_CATEGORY_ORDER)[number], string> =
  {
    staff: "Staff positions",
    media: "Media and content",
    "game-officials": "Game officials",
    management: "Management and support",
  };
