/**
 * RallyGame — keep-the-ball-up mini game shown on the "we couldn't reach the server" screen,
 * so a visitor waiting out a backend restart has something to do besides mash refresh.
 *
 * Space / ArrowUp / a tap bumps the ball over the oncoming nets; touching one ends the rally.
 * Ported from troj-model-dashboard's RunnerGame - the physics constants are carried over
 * unchanged, the dino is a volleyball, the cacti are nets, and the best score lives in
 * localStorage rather than being POSTed, since this app has no scoreboard endpoint to hold it.
 *
 * Lives in `components/game/`; rendered by ServiceErrorPage (kind="unavailable").
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import PixelNet, { NET_VARIANTS, netSize } from "./PixelNet";

const FIELD_HEIGHT = 190;
const GROUND_HEIGHT = 4;
const BALL_X = 24;
const BALL_SIZE = 32;
const GRAVITY = 2600;
const BUMP_VELOCITY = -820;
const BASE_SPEED = 220; // px/s
const SPEED_RAMP = 4; // px/s added per point of score
/* The gap between nets is a TIME budget, not a fixed pixel distance. Airtime on a bump is
   fixed by GRAVITY/BUMP_VELOCITY at ~0.63s and does not shrink as the game speeds up, so a
   fixed-px gap eventually arrives faster than one bump can clear it. Converting to px at spawn
   time (gap seconds x current speed) keeps the real time between nets constant however fast
   the rally gets - only the visual density on screen increases. */
const MIN_GAP_SECONDS = 1.1;
const MAX_GAP_SECONDS = 1.9;

/** Best score is a local nicety, not a record - a cleared localStorage just resets it. */
const BEST_SCORE_KEY = "rvl-rally-best";

function readBestScore(): number {
  try {
    const stored = Number(window.localStorage.getItem(BEST_SCORE_KEY));
    return Number.isFinite(stored) && stored > 0 ? Math.floor(stored) : 0;
  } catch {
    // localStorage throws outright in some locked-down/private browser modes.
    return 0;
  }
}

function writeBestScore(score: number): void {
  try {
    window.localStorage.setItem(BEST_SCORE_KEY, String(score));
  } catch {
    // Nothing to do - the run still counts on screen for this session.
  }
}

interface Net {
  id: number;
  x: number;
  variant: number;
}

type Phase = "idle" | "playing" | "over";

const RallyGame: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fieldWidth, setFieldWidth] = useState(320);
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [ballY, setBallY] = useState(0);
  const [spin, setSpin] = useState(0);
  const [nets, setNets] = useState<Net[]>([]);

  /* The animation loop reads and writes these every frame. They are refs, not state, because a
     frame must see the value the previous frame wrote - a setState from inside the same rAF
     callback would not have landed yet. The state above exists only so React re-renders. */
  const phaseRef = useRef<Phase>("idle");
  const velocityRef = useRef(0);
  const ballYRef = useRef(0);
  const netsRef = useRef<Net[]>([]);
  const nextNetIdRef = useRef(0);
  const distanceToNextRef = useRef(0);
  const scoreRef = useRef(0);
  const spinRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    setBest(readBestScore());
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setFieldWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const startRally = useCallback(() => {
    scoreRef.current = 0;
    setScore(0);
    netsRef.current = [];
    setNets([]);
    distanceToNextRef.current = 160;
    velocityRef.current = BUMP_VELOCITY;
    ballYRef.current = 0;
    setBallY(0);
    phaseRef.current = "playing";
    setPhase("playing");
  }, []);

  const bump = useCallback(() => {
    if (phaseRef.current === "idle" || phaseRef.current === "over") {
      startRally();
      return;
    }
    // Only bump a ball that is on the floor; no mid-air double jumps.
    if (ballYRef.current >= -0.5) {
      velocityRef.current = BUMP_VELOCITY;
    }
  }, [startRally]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        bump();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [bump]);

  useEffect(() => {
    if (phase !== "playing") return;

    const speedAt = () => BASE_SPEED + scoreRef.current * SPEED_RAMP;

    const tick = (time: number) => {
      if (lastTimeRef.current == null) lastTimeRef.current = time;
      // Clamped so a backgrounded tab does not resume with one enormous step that teleports
      // the ball straight through a net.
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      velocityRef.current += GRAVITY * dt;
      let nextY = ballYRef.current + velocityRef.current * dt;
      if (nextY > 0) {
        nextY = 0;
        velocityRef.current = 0;
      }
      ballYRef.current = nextY;
      setBallY(nextY);

      const speed = speedAt();

      // The ball is nominally rolling along the court, so spin tracks distance travelled.
      spinRef.current = (spinRef.current + speed * dt * 1.2) % 360;
      setSpin(spinRef.current);

      distanceToNextRef.current -= speed * dt;
      netsRef.current = netsRef.current
        .map(n => ({ ...n, x: n.x - speed * dt }))
        .filter(n => n.x + netSize(n.variant).width > -10);
      if (distanceToNextRef.current <= 0) {
        const variant = Math.floor(Math.random() * NET_VARIANTS.length);
        netsRef.current = [...netsRef.current, { id: nextNetIdRef.current++, x: fieldWidth + 10, variant }];
        const gapSeconds = MIN_GAP_SECONDS + Math.random() * (MAX_GAP_SECONDS - MIN_GAP_SECONDS);
        distanceToNextRef.current = gapSeconds * speed;
      }
      setNets(netsRef.current);

      scoreRef.current += dt * 10;
      setScore(Math.floor(scoreRef.current));

      const ballTop = FIELD_HEIGHT - GROUND_HEIGHT - BALL_SIZE + ballYRef.current;
      const ballBottom = FIELD_HEIGHT - GROUND_HEIGHT + ballYRef.current;
      const collided = netsRef.current.some(n => {
        const { width, height } = netSize(n.variant);
        const netTop = FIELD_HEIGHT - GROUND_HEIGHT - height;
        const overlapsX = BALL_X + BALL_SIZE > n.x && BALL_X < n.x + width;
        const overlapsY = ballBottom > netTop && ballTop < FIELD_HEIGHT - GROUND_HEIGHT;
        return overlapsX && overlapsY;
      });
      if (collided) {
        phaseRef.current = "over";
        setPhase("over");
        const finalScore = Math.floor(scoreRef.current);
        setBest(previous => {
          if (finalScore <= previous) return previous;
          writeBestScore(finalScore);
          return finalScore;
        });
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
    };
  }, [phase, fieldWidth]);

  return (
    <div className="w-full min-w-0 max-w-[480px] select-none">
      <div
        ref={containerRef}
        onClick={bump}
        onTouchStart={e => {
          e.preventDefault();
          bump();
        }}
        className="relative w-full cursor-pointer overflow-hidden rounded-lg border border-border bg-bg"
        style={{ height: FIELD_HEIGHT }}
      >
        {/* Court floor. */}
        <div className="absolute inset-x-0 bottom-0 border-t border-brand-primary" style={{ height: GROUND_HEIGHT }} />

        {/* The ball: a white circle with navy seams, spun by distance travelled. */}
        <div
          className="absolute"
          style={{ left: BALL_X, width: BALL_SIZE, height: BALL_SIZE, bottom: GROUND_HEIGHT - ballY }}
        >
          <div
            className="relative h-full w-full rounded-full border-2 border-brand-primary bg-bg"
            style={{ transform: `rotate(${spin}deg)` }}
            aria-hidden
          >
            <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-brand-primary" />
            <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-brand-primary" />
          </div>
        </div>

        {nets.map(n => (
          <div key={n.id} className="absolute" style={{ left: n.x, bottom: GROUND_HEIGHT }}>
            <PixelNet variant={n.variant} />
          </div>
        ))}

        <div className="absolute right-2 top-2 font-mono text-xs text-text-muted">
          {String(score).padStart(5, "0")}
          {best > 0 && <span className="ml-2 text-text-subtle">BEST {String(best).padStart(5, "0")}</span>}
        </div>

        {phase !== "playing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg px-6 text-center text-xs text-text-muted">
            {phase === "idle" ? (
              <span>
                Press <kbd className="rounded-sm border border-border px-1">Space</kbd> or tap to keep a rally going
                while you wait
              </span>
            ) : (
              <span>
                Rally over — {score}. Press <kbd className="rounded-sm border border-border px-1">Space</kbd> or tap to
                serve again
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RallyGame;
