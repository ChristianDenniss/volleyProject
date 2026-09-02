"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const KINDS = ["player", "team", "season"] as const;
const DIFFICULTIES = ["easy", "medium", "hard", "impossible"] as const;

type Kind = (typeof KINDS)[number];
type Difficulty = (typeof DIFFICULTIES)[number];

interface Subject {
  id: number;
  hintCount: number;
  clues: { label: string; value: string }[];
}

const pillClass =
  "cursor-pointer rounded-xs border px-4 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] transition-colors";
const pillOn = "border-rvl-accent-bg bg-rvl-accent-bg text-rvl-on-accent";
const pillOff =
  "border-rvl-line bg-transparent text-rvl-dim hover:border-rvl-accent-soft hover:text-rvl-accent";

export function TriviaBoard({
  kind,
  difficulty,
  subject,
}: {
  kind: Kind;
  difficulty: Difficulty;
  subject: Subject | null;
}) {
  const router = useRouter();
  const [guess, setGuess] = useState("");
  const [revealed, setRevealed] = useState(1);
  const [outcome, setOutcome] = useState<{ correct: boolean; answer: string } | null>(null);
  const check = trpc.trivia.checkGuess.useMutation();

  const navigate = (next: { kind?: Kind; difficulty?: Difficulty }) => {
    const params = new URLSearchParams({
      kind: next.kind ?? kind,
      difficulty: next.difficulty ?? difficulty,
      pick: String(Math.floor(Math.random() * 1_000_000)),
    });
    setGuess("");
    setRevealed(1);
    setOutcome(null);
    router.push(`/trivia?${params.toString()}`);
  };

  return (
    <>
      <div className="flex flex-col gap-6 border-b border-rvl-line px-5 py-7 sm:px-8 xl:px-14">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-3 w-[72px] font-mono text-[0.58rem] uppercase tracking-[0.22em] text-rvl-dim">
            Subject
          </span>
          {KINDS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => navigate({ kind: option })}
              className={cn(pillClass, option === kind ? pillOn : pillOff)}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-3 w-[72px] font-mono text-[0.58rem] uppercase tracking-[0.22em] text-rvl-dim">
            Difficulty
          </span>
          {DIFFICULTIES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => navigate({ difficulty: option })}
              className={cn(pillClass, option === difficulty ? pillOn : pillOff)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {subject === null ? null : (
        <section className="grid grid-cols-1 gap-8 border-b border-rvl-line px-5 py-12 sm:px-8 md:grid-cols-[210px_1fr] md:gap-14 xl:px-14">
          <div>
            <h2 className="m-0 mb-3 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
              Name the {kind}
            </h2>
            <p className="m-0 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-dim">
              {/* hintCount is the difficulty's allowance, but the page only ever
                  builds 4-6 clues, so quote what can actually be revealed. */}
              {difficulty} · {Math.min(subject.hintCount, subject.clues.length)} clues available
            </p>
          </div>

          <div className="flex flex-col gap-8">
            <ol className="m-0 flex list-none flex-col border-t border-rvl-line p-0">
              {subject.clues.slice(0, revealed).map((clue, index) => (
                <li
                  key={clue.label}
                  className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-rvl-line py-4"
                >
                  <span className="w-6 shrink-0 font-mono text-[0.66rem] tabular-nums text-rvl-dim">
                    {index + 1}
                  </span>
                  <span className="w-[150px] shrink-0 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-rvl-dim">
                    {clue.label}
                  </span>
                  <span className="text-[1rem] font-semibold capitalize">
                    {clue.value || "unknown"}
                  </span>
                </li>
              ))}
            </ol>

            <form
              className="flex flex-col gap-5"
              onSubmit={async (event) => {
                event.preventDefault();
                try {
                  const result = await check.mutateAsync({ type: kind, id: subject.id, guess });
                  setOutcome({ correct: result.correct, answer: result.answer });
                  if (result.correct) toast.success("Correct!");
                } catch {
                  toast.error("That guess could not be checked.");
                }
              }}
            >
              <input
                required
                value={guess}
                placeholder={`Name the ${kind}`}
                onChange={(event) => setGuess(event.target.value)}
                className="w-full max-w-[520px] rounded-xs border border-rvl-line bg-transparent px-4 py-3.5 text-[1rem] text-rvl-ink placeholder:text-rvl-dim focus:border-rvl-accent-soft focus:outline-none"
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={check.isPending}
                  className="cursor-pointer border-none bg-rvl-accent-bg px-6 py-3.5 font-mono text-[0.7rem] font-bold uppercase tracking-[0.14em] text-rvl-on-accent transition-opacity hover:enabled:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Guess
                </button>
                <button
                  type="button"
                  disabled={revealed >= subject.clues.length}
                  onClick={() => setRevealed((value) => value + 1)}
                  className="cursor-pointer border border-rvl-line bg-transparent px-6 py-3.5 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-rvl-ink-2 transition-colors hover:enabled:border-rvl-accent-soft hover:enabled:text-rvl-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reveal another clue
                </button>
                <button
                  type="button"
                  onClick={() => navigate({})}
                  className="cursor-pointer border border-rvl-line bg-transparent px-6 py-3.5 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-rvl-ink-2 transition-colors hover:border-rvl-accent-soft hover:text-rvl-accent"
                >
                  New question
                </button>
              </div>
            </form>

            {outcome ? (
              <p
                className={cn(
                  "m-0 border-l-2 py-2 pl-4 font-mono text-[0.78rem] uppercase tracking-[0.12em]",
                  outcome.correct
                    ? "border-rvl-mint text-rvl-mint"
                    : "border-rvl-line-strong text-rvl-ink-2",
                )}
              >
                {outcome.correct ? `Correct — ${outcome.answer}.` : "Not quite. Try another clue."}
              </p>
            ) : null}
          </div>
        </section>
      )}
    </>
  );
}
