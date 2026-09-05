"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { usePortalErrorToast } from "./portal-error-detail";
import { PortalSelect } from "./portal-select";
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
  name: string | null;
  matchNumber: string | null;
  round: string | null;
  status: string;
  phase: string;
  region: string;
  date: string;
  stage: string;
  seasonId: number | null;
  team1Score: number | null;
  team2Score: number | null;
  seasonNumber: number | null;
  videoUrl: string | null;
  teams: { id: number; name: string }[];
  staff: {
    streamed: { id: string; name: string; email: string } | null;
    reffed: { id: string; name: string; email: string } | null;
    commentated: { id: string; name: string; email: string } | null;
  };
}

const COLUMNS: ColumnSpec<Row>[] = [
  {
    key: "matchNumber",
    label: "Match",
    render: (row) => row.matchNumber ?? row.name ?? `#${row.id}`,
  },
  { key: "round", label: "Round", render: (row) => row.round ?? row.stage ?? "—" },
  {
    key: "teams",
    label: "Teams",
    render: (row) => {
      const team1 = row.teams[0]?.name ?? "TBD";
      const team2 = row.teams[1]?.name ?? "TBD";
      return `${team1} vs ${team2}`;
    },
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
    render: (row) => (
      <Badge variant={row.status === "completed" ? "secondary" : "default"}>{row.status}</Badge>
    ),
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
  const showErrorToast = usePortalErrorToast();
  const [open, setOpen] = useState(false);
  const [tournamentId, setTournamentId] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [phase, setPhase] = useState<Phase>("qualifiers");
  const [region, setRegion] = useState<Region>("na");
  const runImport = trpc.games.importFromChallonge.useMutation();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="cursor-pointer border border-rvl-line bg-transparent px-4 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-ink-2 transition-colors hover:border-rvl-accent-soft hover:text-rvl-accent"
        >
          Import from Challonge
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import a Challonge bracket</DialogTitle>
          <DialogDescription>
            Games already imported for this tournament are skipped. The worker needs
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
              showErrorToast("Challonge import failed", error);
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
            <PortalSelect
              id="import-season"
              required
              value={seasonId}
              onChange={setSeasonId}
              options={seasons.map((season) => ({
                value: String(season.id),
                label: season.label,
              }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="import-phase">Phase</Label>
              <PortalSelect
                id="import-phase"
                value={phase}
                onChange={(value) => setPhase(value as Phase)}
                options={PHASES.map((option) => ({ value: option, label: option }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-region">Region</Label>
              <PortalSelect
                id="import-region"
                value={region}
                onChange={(value) => setRegion(value as Region)}
                options={REGIONS.map((option) => ({ value: option, label: option }))}
              />
            </div>
          </div>

          <DialogFooter>
            <button
              type="submit"
              className="cursor-pointer border-none bg-rvl-accent-bg px-5 py-2.5 font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-rvl-on-accent transition-opacity hover:enabled:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={runImport.isPending}
            >
              {runImport.isPending ? "Importing…" : "Import"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function parseTeamId(value: string) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseScore(value: string) {
  if (!value.trim()) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function GamesManager({
  rows,
  seasons,
  teams,
}: {
  rows: Row[];
  seasons: { id: number; label: string }[];
  teams: { id: number; name: string; seasonId: number | null }[];
}) {
  const create = trpc.games.create.useMutation();
  const update = trpc.games.update.useMutation();
  const remove = trpc.games.delete.useMutation();

  const teamOptions = [
    { value: "", label: "TBD" },
    ...teams.map((team) => ({
      value: String(team.id),
      label: team.name,
    })),
  ];

  const fields: FieldSpec[] = [
    { name: "matchNumber", label: "Match number", type: "text" },
    { name: "round", label: "Round", type: "text" },
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
    { name: "team1Id", label: "Team 1", type: "select", options: teamOptions },
    { name: "team2Id", label: "Team 2", type: "select", options: teamOptions },
    { name: "team1Score", label: "Team 1 sets", type: "number" },
    { name: "team2Score", label: "Team 2 sets", type: "number" },
    { name: "stage", label: "Stage", type: "text" },
    { name: "videoUrl", label: "Video URL", type: "url" },
    { name: "streamer", label: "Streamer", type: "text", placeholder: "Roblox username" },
    { name: "referee", label: "Referee", type: "text", placeholder: "Roblox username" },
    { name: "commentator", label: "Commentator", type: "text", placeholder: "Roblox username" },
  ];

  const toInput = (values: Record<string, string>) => ({
    matchNumber: optionalText(pick(values, "matchNumber")) ?? null,
    round: optionalText(pick(values, "round")) ?? null,
    date: pick(values, "date"),
    seasonId: Number.parseInt(pick(values, "seasonId"), 10),
    status: (optionalText(pick(values, "status")) as Status) ?? "scheduled",
    phase: (optionalText(pick(values, "phase")) as Phase) ?? "qualifiers",
    region: (optionalText(pick(values, "region")) as Region) ?? "na",
    team1Id: parseTeamId(pick(values, "team1Id")),
    team2Id: parseTeamId(pick(values, "team2Id")),
    team1Score: parseScore(pick(values, "team1Score")),
    team2Score: parseScore(pick(values, "team2Score")),
    stage: optionalText(pick(values, "stage")),
    videoUrl: optionalText(pick(values, "videoUrl")) ?? null,
    streamer: pick(values, "streamer").trim() || null,
    referee: pick(values, "referee").trim() || null,
    commentator: pick(values, "commentator").trim() || null,
  });

  return (
    <ResourceView<Row>
      title="game"
      rows={rows}
      columns={COLUMNS}
      fields={fields}
      extra={<ChallongeImport seasons={seasons} />}
      toValues={(row) => ({
        matchNumber: row.matchNumber ?? "",
        round: row.round ?? "",
        date: row.date,
        seasonId: row.seasonId ? String(row.seasonId) : "",
        status: row.status,
        phase: row.phase,
        region: row.region,
        team1Id: row.teams[0] ? String(row.teams[0].id) : "",
        team2Id: row.teams[1] ? String(row.teams[1].id) : "",
        team1Score: row.team1Score === null ? "" : String(row.team1Score),
        team2Score: row.team2Score === null ? "" : String(row.team2Score),
        stage: row.stage ?? "",
        videoUrl: row.videoUrl ?? "",
        streamer: row.staff.streamed?.email ?? "",
        referee: row.staff.reffed?.email ?? "",
        commentator: row.staff.commentated?.email ?? "",
      })}
      onCreate={(values) => create.mutateAsync(toInput(values))}
      onUpdate={(id, values) => update.mutateAsync({ id: id as number, patch: toInput(values) })}
      onDelete={(id) => remove.mutateAsync({ id: id as number })}
    />
  );
}
