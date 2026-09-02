"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { pick, ResourceView, type ColumnSpec, type FieldSpec } from "./resource-view";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/ui/dialog";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { parseStatCsv } from "@/lib/stat-csv";
import { trpc } from "@/lib/trpc";

interface Row {
  id: number;
  playerId: number;
  playerName: string;
  gameId: number;
  gameName: string | null;
  gameDate: string;
  spikeKills: number;
  spikeAttempts: number;
  apeKills: number;
  apeAttempts: number;
  assists: number;
  blocks: number;
  digs: number;
  aces: number;
}

const COUNTERS = [
  ["spikeKills", "Spike kills"],
  ["spikeAttempts", "Spike attempts"],
  ["spikingErrors", "Spike errors"],
  ["apeKills", "Ape kills"],
  ["apeAttempts", "Ape attempts"],
  ["assists", "Assists"],
  ["settingErrors", "Setting errors"],
  ["blocks", "Blocks"],
  ["blockFollows", "Block follows"],
  ["digs", "Digs"],
  ["aces", "Aces"],
  ["servingErrors", "Serving errors"],
  ["miscErrors", "Misc errors"],
] as const;

const COLUMNS: ColumnSpec<Row>[] = [
  {
    key: "player",
    label: "Player",
    render: (row) => <span className="capitalize">{row.playerName}</span>,
  },
  { key: "game", label: "Game", render: (row) => row.gameName ?? `Game ${row.gameId}` },
  { key: "date", label: "Date", render: (row) => row.gameDate },
  {
    key: "kills",
    label: "Kills",
    align: "right",
    render: (row) => row.spikeKills + row.apeKills,
  },
  { key: "assists", label: "Assists", align: "right", render: (row) => row.assists },
  { key: "blocks", label: "Blocks", align: "right", render: (row) => row.blocks },
  { key: "digs", label: "Digs", align: "right", render: (row) => row.digs },
  { key: "aces", label: "Aces", align: "right", render: (row) => row.aces },
];

function counterValues(values: Record<string, string>) {
  return Object.fromEntries(
    COUNTERS.map(([name]) => [name, Number.parseInt(values[name] ?? "0", 10) || 0]),
  ) as Record<(typeof COUNTERS)[number][0], number>;
}

function CsvUpload({ games }: { games: { id: number; label: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [gameId, setGameId] = useState("");
  const [csv, setCsv] = useState("");
  const upload = trpc.stats.createManyFromRows.useMutation();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={"cursor-pointer rounded border border-[#2d3c50] bg-white px-4 py-2 text-base text-[#2d3c50] transition-colors duration-200 hover:bg-[#2d3c50] hover:text-white"}>
          Upload CSV
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload stat lines</DialogTitle>
          <DialogDescription>
            Paste the CSV. The header row names the columns; a player column and one column per
            counter are expected. Parsing happens in the browser and rows are sent as JSON.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              const rows = parseStatCsv(csv);
              if (rows.length === 0) throw new Error("No data rows were found in that CSV");
              await upload.mutateAsync({ gameId: Number.parseInt(gameId, 10), rows });
              toast.success(`${rows.length} stat lines uploaded.`);
              setOpen(false);
              setCsv("");
              router.refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "That upload failed.");
            }
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="csv-game">Game</Label>
            <select
              id="csv-game"
              required
              value={gameId}
              onChange={(event) => setGameId(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Choose…</option>
              {games.map((game) => (
                <option key={game.id} value={String(game.id)}>
                  {game.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-body">CSV</Label>
            <Textarea
              id="csv-body"
              required
              rows={12}
              value={csv}
              placeholder="player,spikeKills,spikeAttempts,assists"
              onChange={(event) => setCsv(event.target.value)}
            />
          </div>

          <DialogFooter>
            <button type="submit" className={"cursor-pointer rounded border-none bg-[#007bff] px-4 py-2 text-base text-white transition-colors duration-200 hover:enabled:bg-[#0056b3] disabled:cursor-not-allowed disabled:bg-[#ccc]"} disabled={upload.isPending}>
              {upload.isPending ? "Uploading…" : "Upload"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function StatsManager({
  rows,
  games,
  players,
}: {
  rows: Row[];
  games: { id: number; label: string }[];
  players: string[];
}) {
  const create = trpc.stats.createByName.useMutation();
  const update = trpc.stats.update.useMutation();
  const remove = trpc.stats.delete.useMutation();

  const fields: FieldSpec[] = [
    {
      name: "playerName",
      label: "Player",
      type: "select",
      required: true,
      options: players.map((player) => ({ value: player, label: player })),
    },
    {
      name: "gameId",
      label: "Game",
      type: "select",
      required: true,
      options: games.map((game) => ({ value: String(game.id), label: game.label })),
    },
    ...COUNTERS.map(([name, label]) => ({ name, label, type: "number" as const })),
  ];

  return (
    <ResourceView<Row>
      title="stat line"
      rows={rows}
      columns={COLUMNS}
      fields={fields}
      extra={<CsvUpload games={games} />}
      toValues={(row) => ({
        playerName: row.playerName,
        gameId: String(row.gameId),
        ...Object.fromEntries(
          COUNTERS.map(([name]) => [name, String((row as unknown as Record<string, number>)[name] ?? 0)]),
        ),
      })}
      onCreate={(values) =>
        create.mutateAsync({
          playerName: pick(values, "playerName"),
          gameId: Number.parseInt(pick(values, "gameId"), 10),
          ...counterValues(values),
        })
      }
      onUpdate={(id, values) =>
        update.mutateAsync({ id: id as number, patch: counterValues(values) })
      }
      onDelete={(id) => remove.mutateAsync({ id: id as number })}
    />
  );
}
