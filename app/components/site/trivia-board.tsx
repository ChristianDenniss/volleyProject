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

const KIND_ICON: Record<Kind, string> = {
  player: "P",
  team: "T",
  season: "S",
};

const DIFFICULTY_COLOR: Record<Difficulty, { border: string; selected: string; badge: string }> = {
  easy: {
    border: "border-success text-success",
    selected: "bg-success text-white border-success",
    badge: "bg-success/10 text-success border border-success/20",
  },
  medium: {
    border: "border-warning text-warning",
    selected: "bg-warning text-white border-warning",
    badge: "bg-warning/10 text-warning border border-warning/20",
  },
  hard: {
    border: "border-[#e74c3c] text-[#e74c3c]",
    selected: "bg-[#e74c3c] text-white border-[#e74c3c]",
    badge: "bg-[#e74c3c]/10 text-[#e74c3c] border border-[#e74c3c]/20",
  },
  impossible: {
    border: "border-[#8e44ad] text-[#8e44ad]",
    selected: "bg-[#8e44ad] text-white border-[#8e44ad]",
    badge: "bg-[#8e44ad]/10 text-[#8e44ad] border border-[#8e44ad]/20",
  },
};

const HINT_LEVEL = [
  "bg-success/5 text-success border-l-success",
  "bg-warning/5 text-warning border-l-warning",
  "bg-[#e74c3c]/5 text-[#e74c3c] border-l-[#e74c3c]",
  "bg-[#3498db]/5 text-[#3498db] border-l-[#3498db]",
  "bg-[#9b59b6]/5 text-[#9b59b6] border-l-[#9b59b6]",
];

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
    <div>
      <div className="rounded-xl bg-white px-8 py-12 text-center shadow-[0_4px_15px_rgba(0,0,0,0.1)] max-md:px-4 max-md:py-8">
        <h1 className="mb-4 text-[3rem] font-bold tracking-tight text-brand-navy max-md:text-[2rem]">
          Volleyball Trivia
        </h1>
        <p className="mb-12 text-[1.2rem] font-normal text-[#7f8c8d]">
          Pick a subject and a difficulty, read the clues, and name it.
        </p>

        <section className="mb-12">
          <h2 className="mb-8 text-2xl font-semibold text-[#2c3e50]">Choose a subject</h2>
          <div className="flex flex-wrap justify-center gap-8">
            {KINDS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => navigate({ kind: option })}
                className={cn(
                  "group relative flex min-w-[160px] cursor-pointer flex-col items-center overflow-hidden rounded-xl border-2 px-8 py-10 transition-all duration-300 hover:-translate-y-1 hover:border-brand-navy hover:shadow-[0_8px_25px_rgba(0,0,0,0.2)]",
                  option === kind
                    ? "-translate-y-1 border-brand-navy bg-linear-to-br from-brand-navy to-brand-navy-hover text-white shadow-[0_8px_25px_rgba(45,60,80,0.3)]"
                    : "border-[#e0e0e0] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)]",
                )}
              >
                <span
                  className={cn(
                    "mb-4 flex size-20 items-center justify-center rounded-full border-2 text-[3.5rem] font-bold transition-transform duration-300 group-hover:scale-110 group-hover:border-brand-navy group-hover:bg-brand-navy group-hover:text-white",
                    option === kind
                      ? "border-white bg-white text-brand-navy"
                      : "border-[#e0e0e0] bg-[#f8f9fa] text-[#2c3e50]",
                  )}
                >
                  {KIND_ICON[option]}
                </span>
                <span className="text-[1.1rem] font-semibold capitalize tracking-wide">
                  {option}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-8 text-2xl font-semibold text-[#2c3e50]">Choose a difficulty</h2>
          <div className="flex flex-wrap justify-center gap-6">
            {DIFFICULTIES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => navigate({ difficulty: option })}
                className={cn(
                  "min-w-[120px] cursor-pointer rounded-lg border-2 bg-white px-10 py-4 text-base font-semibold capitalize transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(0,0,0,0.2)]",
                  option === difficulty
                    ? `-translate-y-0.5 shadow-[0_4px_15px_rgba(0,0,0,0.2)] ${DIFFICULTY_COLOR[option].selected}`
                    : DIFFICULTY_COLOR[option].border,
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </section>
      </div>

      {subject === null ? null : (
        <div className="my-8 rounded-xl bg-white px-10 py-12 shadow-[0_8px_30px_rgba(0,0,0,0.1)] max-md:px-5 max-md:py-8">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#f8f9fa] pb-6">
            <h2 className="m-0 text-[2rem] font-bold capitalize text-[#2c3e50] max-md:text-2xl">
              Name the {kind}
            </h2>
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "rounded-[20px] px-4 py-2 text-[0.85rem] font-semibold uppercase tracking-wider",
                  DIFFICULTY_COLOR[difficulty].badge,
                )}
              >
                {difficulty}
              </span>
              <span className="rounded-[20px] border border-[#e0e0e0] bg-[#f8f9fa] px-4 py-2 text-[0.85rem] font-semibold text-[#7f8c8d]">
                {subject.hintCount} hints allowed
              </span>
            </div>
          </div>

          <section className="mb-10">
            <h3 className="mb-6 text-[1.3rem] font-semibold text-[#2c3e50]">Clues</h3>
            <div className="flex flex-col gap-4">
              {subject.clues.slice(0, revealed).map((clue, index) => (
                <div
                  key={clue.label}
                  className={cn(
                    "rounded-lg border-l-4 p-5 text-base font-medium transition-all duration-300",
                    HINT_LEVEL[index % HINT_LEVEL.length],
                  )}
                >
                  {clue.label}: {clue.value || "unknown"}
                </div>
              ))}
            </div>
          </section>

          <form
            className="mb-6"
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
              className="mb-6 box-border w-full rounded-lg border-2 border-[#e0e0e0] p-5 text-[1.1rem] transition-all duration-300 focus:border-brand-navy focus:shadow-[0_0_0_3px_rgba(45,60,80,0.1)] focus:outline-none"
            />

            <div className="flex flex-wrap justify-center gap-4">
              <button
                type="submit"
                disabled={check.isPending}
                className="cursor-pointer rounded-lg border-none bg-linear-to-br from-success to-[#229954] px-10 py-4 text-base font-semibold text-white shadow-[0_4px_15px_rgba(39,174,96,0.3)] transition-all duration-300 hover:enabled:-translate-y-0.5 hover:enabled:shadow-[0_6px_20px_rgba(39,174,96,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Guess
              </button>
              <button
                type="button"
                disabled={revealed >= subject.clues.length}
                onClick={() => setRevealed((value) => value + 1)}
                className="cursor-pointer rounded-lg border-2 border-brand-navy bg-white px-10 py-4 text-base font-semibold text-brand-navy transition-all duration-300 hover:enabled:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reveal another clue
              </button>
              <button
                type="button"
                onClick={() => navigate({})}
                className="cursor-pointer rounded-lg border-none bg-linear-to-br from-[#e74c3c] to-[#c0392b] px-10 py-4 text-base font-semibold text-white shadow-[0_4px_15px_rgba(231,76,60,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(231,76,60,0.4)]"
              >
                New question
              </button>
            </div>
          </form>

          {outcome ? (
            <p
              className={cn(
                "rounded-lg p-4 text-center font-semibold",
                outcome.correct
                  ? "bg-success/10 text-success"
                  : "bg-[#e74c3c]/10 text-[#e74c3c]",
              )}
            >
              {outcome.correct ? `Correct — ${outcome.answer}.` : "Not quite. Try another clue."}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
