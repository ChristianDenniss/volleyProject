"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { pick, ResourceView, optionalText, type ColumnSpec, type FieldSpec } from "./resource-view";
import { Badge } from "@components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { trpc } from "@/lib/trpc";

const STATUSES = ["scheduled", "completed"] as const;
const PHASES = ["qualifiers", "playoffs"] as const;
const REGIONS = ["na", "eu", "as", "sa"] as const;

type Status = (typeof STATUSES)[number];
type Phase = (typeof PHASES)[number];
type Region = (typeof REGIONS)[number];

interface Row {
  id: number;
  matchNumber: string;
  round: string;
  status: string;
  phase: string;
  region: string;
  date: string;
  seasonId: number;
  team1Name: string | null;
  team2Name: string | null;
  team1Score: number | null;
  team2Score: number | null;
}

const COLUMNS: ColumnSpec<Row>[] = [
  { key: "matchNumber", label: "Match", render: (row) => row.matchNumber },
  { key: "round", label: "Round", render: (row) => row.round },
  {
    key: "teams",
    label: "Teams",
    render: (row) => `${row.team1Name ?? "TBD"} vs ${row.team2Name ?? "TBD"}`,
  },
  { key: "date", label: "Date", render: (row) => row.date },
  {
    key: "region",
    label: "Region",
    render: (row) => <Badge variant="outline">{row.region.toUpperCase()}</Badge>,
  },
  {
    key: "status",
    label: "Status",
    render: (row) => <Badge variant={row.status === "completed" ? "secondary" : "default"}>{row.status}</Badge>,
  },
  {
    key: "score",
    label: "Score",
    align: "right",
    render: (row) => `${row.team1Score ?? "–"} – ${row.team2Score ?? "–"}`,
  },
];

function ChallongeImport({ seasons }: { seasons: { id: number; label: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tournamentId, setTournamentId] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [phase, setPhase] = useState<Phase>("qualifiers");
  const [region, setRegion] = useState<Region>("na");
  const runImport = trpc.matches.importFromChallonge.useMutation();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="cursor-pointer border border-rvl-line bg-transparent px-4 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-ink-2 transition-colors hover:border-rvl-accent-soft hover:text-rvl-accent">
          Import from Challonge
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import a Challonge bracket</DialogTitle>
          <DialogDescription>
            Matches already imported for this tournament are skipped. The worker needs
            CHALLONGE_API_KEY set as a secret.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              const result = await runImport.mutateAsync({
                tournamentId,
                seasonId: Number.parseInt(seasonId, 10),
                phase,
                region,
              });
              toast.success(`${result.imported} imported, ${result.skipped} already present.`);
              setOpen(false);
              router.refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "The import failed.");
            }
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="tournament">Tournament id</Label>
            <Input
              id="tournament"
              required
              value={tournamentId}
              onChange={(event) => setTournamentId(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="import-season">Season</Label>
            <select
              id="import-season"
              required
              value={seasonId}
              onChange={(event) => setSeasonId(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Choose…</option>
              {seasons.map((season) => (
                <option key={season.id} value={String(season.id)}>
                  {season.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="import-phase">Phase</Label>
              <select
                id="import-phase"
                value={phase}
                onChange={(event) => setPhase(event.target.value as Phase)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {PHASES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-region">Region</Label>
              <select
                id="import-region"
                value={region}
                onChange={(event) => setRegion(event.target.value as Region)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {REGIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <button type="submit" className="cursor-pointer border-none bg-rvl-accent-bg px-5 py-2.5 font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-rvl-on-accent transition-opacity hover:enabled:opacity-85 disabled:cursor-not-allowed disabled:opacity-50" disabled={runImport.isPending}>
              {runImport.isPending ? "Importing…" : "Import"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MatchesManager({
  rows,
  seasons,
}: {
  rows: Row[];
  seasons: { id: number; label: string }[];
}) {
  const create = trpc.matches.create.useMutation();
  const update = trpc.matches.update.useMutation();
  const remove = trpc.matches.delete.useMutation();

  const fields: FieldSpec[] = [
    { name: "matchNumber", label: "Match number", type: "text", required: true },
    { name: "round", label: "Round", type: "text", required: true },
    { name: "date", label: "Date", type: "date", required: true },
    {
      name: "seasonId",
      label: "Season",
      type: "select",
      required: true,
      options: seasons.map((season) => ({ value: String(season.id), label: season.label })),
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: STATUSES.map((option) => ({ value: option, label: option })),
    },
    {
      name: "phase",
      label: "Phase",
      type: "select",
      options: PHASES.map((option) => ({ value: option, label: option })),
    },
    {
      name: "region",
      label: "Region",
      type: "select",
      options: REGIONS.map((option) => ({ value: option, label: option })),
    },
    { name: "team1Name", label: "Team 1", type: "text" },
    { name: "team2Name", label: "Team 2", type: "text" },
    { name: "team1Score", label: "Team 1 sets", type: "number" },
    { name: "team2Score", label: "Team 2 sets", type: "number" },
  ];

  const toInput = (values: Record<string, string>) => {
    const team1Score = Number.parseInt(pick(values, "team1Score"), 10);
    const team2Score = Number.parseInt(pick(values, "team2Score"), 10);
    return {
      matchNumber: pick(values, "matchNumber"),
      round: pick(values, "round"),
      date: pick(values, "date"),
      seasonId: Number.parseInt(pick(values, "seasonId"), 10),
      status: (optionalText(pick(values, "status")) as Status) ?? "scheduled",
      phase: (optionalText(pick(values, "phase")) as Phase) ?? "qualifiers",
      region: (optionalText(pick(values, "region")) as Region) ?? "na",
      team1Name: optionalText(pick(values, "team1Name")) ?? null,
      team2Name: optionalText(pick(values, "team2Name")) ?? null,
      team1Score: Number.isFinite(team1Score) ? team1Score : null,
      team2Score: Number.isFinite(team2Score) ? team2Score : null,
    };
  };

  return (
    <ResourceView<Row>
      title="match"
      rows={rows}
      columns={COLUMNS}
      fields={fields}
      extra={<ChallongeImport seasons={seasons} />}
      toValues={(row) => ({
        matchNumber: row.matchNumber,
        round: row.round,
        date: row.date,
        seasonId: String(row.seasonId),
        status: row.status,
        phase: row.phase,
        region: row.region,
        team1Name: row.team1Name ?? "",
        team2Name: row.team2Name ?? "",
        team1Score: row.team1Score === null ? "" : String(row.team1Score),
        team2Score: row.team2Score === null ? "" : String(row.team2Score),
      })}
      onCreate={(values) => create.mutateAsync(toInput(values))}
      onUpdate={(id, values) => update.mutateAsync({ id: id as number, patch: toInput(values) })}
      onDelete={(id) => remove.mutateAsync({ id: id as number })}
    />
  );
}
