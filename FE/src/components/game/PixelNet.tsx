/**
 * PixelNet — the pixel-art net a rally has to clear in RallyGame, drawn in brand navy.
 *
 * Three discrete variants rather than a continuously random height, so each one renders as a
 * real sprite on the 4px grid instead of a stretched rectangle: a low practice net, a full
 * net between two posts, and a tall net with antennae.
 */
const CELL = 4;

export const NET_VARIANTS: number[][][] = [
  // low practice net on a single post
  [
    [1, 1, 1, 1, 1],
    [1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  // full net strung between two posts
  [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
  ],
  // match net, antennae above the tape
  [
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
  ],
];

/** Collision maths needs the rendered footprint, which is the grid times the cell size. */
export function netSize(variant: number) {
  const grid = NET_VARIANTS[variant];
  return { width: grid[0].length * CELL, height: grid.length * CELL };
}

export default function PixelNet({ variant }: { variant: number }) {
  const grid = NET_VARIANTS[variant];
  const cols = grid[0].length;

  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, ${CELL}px)` }} aria-hidden>
      {grid.flat().map((cell, i) => (
        <div
          key={i}
          style={{
            width: CELL,
            height: CELL,
            backgroundColor: cell ? "var(--color-brand-primary)" : "transparent",
          }}
        />
      ))}
    </div>
  );
}
