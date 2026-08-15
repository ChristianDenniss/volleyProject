"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Input } from "@components/ui/input";
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
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {KINDS.map((option) => (
          <Button
            key={option}
            size="sm"
            variant={option === kind ? "default" : "outline"}
            onClick={() => navigate({ kind: option })}
          >
            {option}
          </Button>
        ))}
        <span className="w-full sm:w-2" />
        {DIFFICULTIES.map((option) => (
          <Button
            key={option}
            size="sm"
            variant={option === difficulty ? "secondary" : "ghost"}
            onClick={() => navigate({ difficulty: option })}
          >
            {option}
          </Button>
        ))}
      </div>

      {subject === null ? null : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Name the {kind} — {subject.hintCount} hints allowed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="grid gap-2 sm:grid-cols-2">
              {subject.clues.slice(0, revealed).map((clue) => (
                <li key={clue.label} className="rounded-md border border-border px-3 py-2 text-sm">
                  <span className="text-muted-foreground">{clue.label}: </span>
                  {clue.value || "unknown"}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={revealed >= subject.clues.length}
                onClick={() => setRevealed((value) => value + 1)}
              >
                Reveal another clue
              </Button>
              <Button size="sm" variant="ghost" onClick={() => navigate({})}>
                New question
              </Button>
            </div>

            <form
              className="flex gap-2"
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
              <Input
                required
                value={guess}
                placeholder={`Name the ${kind}`}
                onChange={(event) => setGuess(event.target.value)}
              />
              <Button type="submit" disabled={check.isPending}>
                Guess
              </Button>
            </form>

            {outcome ? (
              <p className={outcome.correct ? "text-sm text-success" : "text-sm text-destructive"}>
                {outcome.correct ? `Correct — ${outcome.answer}.` : "Not quite. Try another clue."}
              </p>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
