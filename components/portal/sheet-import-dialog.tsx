"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { usePortalErrorToast } from "./portal-error-detail";
import { PortalSelect } from "./portal-select";
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
import {
  SheetImportPreviewTables,
  type SheetImportPreviewData,
  type SheetRegion,
} from "./sheet-import-preview";
import { trpc } from "@/lib/trpc";
import type { ParsedTeam } from "@server/services/sheet-import/types";

type TeamMode = "teams" | "teams_and_players" | "players";

type Preview = SheetImportPreviewData;

type StagedSources = {
  masterTeams: ParsedTeam[];
  masterGames: Array<{
    key: string;
    region: SheetRegion;
    phase: "qualifiers" | "playoffs";
    round: string;
    date: string;
    team1Name: string;
    team2Name: string;
    team1Score: number | null;
    team2Score: number | null;
    setScores: string[];
    forfeit: boolean;
  }>;
  regionalTeams: Array<{ name: string; region: SheetRegion | null; playerNames: string[] }>;
  regionalBlocks: Array<{
    teamName: string;
    region: SheetRegion;
    winnerName: string;
    teamScore: number;
    opponentScore: number;
    rows: Array<{
      playerName: string;
      spikeKills: number;
      spikeAttempts: number;
      spikingErrors: number;
      apeKills: number;
      apeAttempts: number;
      assists: number;
      settingErrors: number;
      blocks: number;
      blockFollows: number;
      digs: number;
      aces: number;
      servingErrors: number;
      miscErrors: number;
    }>;
  }>;
  sourceWarnings: string[];
};

type ProgressState = {
  active: boolean;
  failed?: boolean;
  index: number;
  total: number;
  label: string;
  detail?: string | undefined;
  log: string[];
};

const buttonClass =
  "cursor-pointer border border-rvl-line bg-transparent px-4 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-ink-2 transition-colors hover:border-rvl-accent-soft hover:text-rvl-accent";

const primaryClass =
  "cursor-pointer border-none bg-rvl-accent-bg px-5 py-2.5 font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-rvl-on-accent transition-opacity hover:enabled:opacity-85 disabled:cursor-not-allowed disabled:opacity-50";

function ImportProgress({
  progress,
  onViewError,
}: {
  progress: ProgressState;
  onViewError?: (() => void) | undefined;
}) {
  if (!progress.active) return null;
  const pct = progress.total > 0 ? Math.min(100, Math.round((progress.index / progress.total) * 100)) : 0;

  return (
    <div
      className={`space-y-3 border p-4 ${progress.failed ? "border-destructive/40 bg-destructive/5" : "border-rvl-line bg-rvl-panel/40"}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p
          className={`font-mono text-[0.72rem] uppercase tracking-[0.14em] ${progress.failed ? "text-destructive" : "text-rvl-accent"}`}
        >
          {progress.failed
            ? "Failed"
            : `Step ${Math.min(progress.index + 1, progress.total)} of ${progress.total}`}
        </p>
        <p className="font-mono text-[0.62rem] text-rvl-ink-2">{pct}%</p>
      </div>
      <div className="h-1.5 overflow-hidden bg-rvl-line">
        <div
          className={`h-full transition-[width] duration-300 ${progress.failed ? "bg-destructive" : "bg-rvl-accent"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div>
        <p className="text-[0.9rem] text-rvl-ink">{progress.label}</p>
        {progress.detail ? (
          <p className="mt-1 font-mono text-[0.68rem] text-rvl-ink-2">{progress.detail}</p>
        ) : null}
        {progress.failed && onViewError ? (
          <button type="button" className={`${buttonClass} mt-3`} onClick={onViewError}>
            View full error
          </button>
        ) : null}
      </div>
      {progress.log.length > 0 ? (
        <ul className="max-h-28 space-y-1 overflow-auto border-t border-rvl-line pt-2 font-mono text-[0.62rem] text-rvl-ink-2">
          {progress.log.map((line) => (
            <li key={line}>✓ {line}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function useSheetUrls() {
  const [masterUrl, setMasterUrl] = useState("");
  const [naUrl, setNaUrl] = useState("");
  const [euUrl, setEuUrl] = useState("");
  const [asUrl, setAsUrl] = useState("");
  return { masterUrl, setMasterUrl, naUrl, setNaUrl, euUrl, setEuUrl, asUrl, setAsUrl };
}

type SheetUrlState = ReturnType<typeof useSheetUrls>;

function SheetUrlFields({
  masterRequired,
  masterUrl,
  setMasterUrl,
  naUrl,
  setNaUrl,
  euUrl,
  setEuUrl,
  asUrl,
  setAsUrl,
}: SheetUrlState & { masterRequired: boolean }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="sheet-master">Master sheet URL{masterRequired ? "" : " (optional)"}</Label>
        <Input
          id="sheet-master"
          value={masterUrl}
          onChange={(event) => setMasterUrl(event.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/…"
          required={masterRequired}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="sheet-na">NA stats</Label>
          <Input id="sheet-na" value={naUrl} onChange={(event) => setNaUrl(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sheet-eu">EU stats</Label>
          <Input id="sheet-eu" value={euUrl} onChange={(event) => setEuUrl(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sheet-as">AS stats</Label>
          <Input id="sheet-as" value={asUrl} onChange={(event) => setAsUrl(event.target.value)} />
        </div>
      </div>
      <p className="font-mono text-[0.62rem] text-rvl-ink-2">
        Sheets must be shared as Anyone with the link can view.
      </p>
    </div>
  );
}

function regionalPayload(naUrl: string, euUrl: string, asUrl: string) {
  const payload: { na?: string; eu?: string; as?: string } = {};
  if (naUrl) payload.na = naUrl;
  if (euUrl) payload.eu = euUrl;
  if (asUrl) payload.as = asUrl;
  return payload;
}

function emptyProgress(): ProgressState {
  return { active: false, index: 0, total: 1, label: "", log: [] };
}

function useSheetPreviewLoader() {
  const startSession = trpc.sheetImport.startSession.useMutation();
  const loadMaster = trpc.sheetImport.loadMaster.useMutation();
  const loadRegionalBatch = trpc.sheetImport.loadRegionalBatch.useMutation();
  const assemble = trpc.sheetImport.assemblePreview.useMutation();
  const [progress, setProgress] = useState<ProgressState>(emptyProgress());

  const run = async (input: {
    mode: "full" | TeamMode;
    masterUrl?: string;
    regionalUrls: { na?: string; eu?: string; as?: string };
    startDate?: string;
    seasonNumber?: number;
    seasonId?: number;
    endDate?: string | null;
    theme?: string | null;
  }): Promise<{ preview: Preview; sources: StagedSources; sessionId: string }> => {
    const regionalEntries = (
      [
        ["na", input.regionalUrls.na],
        ["eu", input.regionalUrls.eu],
        ["as", input.regionalUrls.as],
      ] as const
    ).filter((entry): entry is [SheetRegion, string] => Boolean(entry[1]));

    const total = (input.masterUrl ? 1 : 0) + regionalEntries.length + 1;
    let index = 0;
    const log: string[] = [];

    const bump = (label: string, detail?: string) => {
      setProgress({ active: true, failed: false, index, total, label, detail, log: [...log] });
    };

    const doneStep = (summary: string) => {
      log.push(summary);
      index += 1;
      setProgress({ active: true, failed: false, index, total, label: summary, log: [...log] });
    };

    setProgress({ active: true, failed: false, index: 0, total, label: "Starting…", log: [] });
    const { sessionId } = await startSession.mutateAsync();

    let masterTeams: StagedSources["masterTeams"] = [];
    let masterGames: Array<{
      key: string;
      region: SheetRegion;
      phase: "qualifiers" | "playoffs";
      round: string;
      date: string;
      team1Name: string;
      team2Name: string;
      team1Score: number | null;
      team2Score: number | null;
      setScores: string[];
      forfeit: boolean;
    }> = [];
    const regionalTeams: Array<{ name: string; region: SheetRegion | null; playerNames: string[] }> =
      [];
    const regionalBlocks: Array<{
      teamName: string;
      region: SheetRegion;
      winnerName: string;
      teamScore: number;
      opponentScore: number;
      rows: Array<{
        playerName: string;
        spikeKills: number;
        spikeAttempts: number;
        spikingErrors: number;
        apeKills: number;
        apeAttempts: number;
        assists: number;
        settingErrors: number;
        blocks: number;
        blockFollows: number;
        digs: number;
        aces: number;
        servingErrors: number;
        miscErrors: number;
      }>;
    }> = [];
    const sourceWarnings: string[] = [];

    try {
      if (input.masterUrl) {
        bump("Loading master schedule sheet…", "Reading NA/EU/AS teams and match tabs");
        const master = await loadMaster.mutateAsync({
          url: input.masterUrl,
          sessionId,
          ...(input.startDate ? { startDate: input.startDate } : {}),
        });
        masterTeams = master.teams;
        masterGames = master.games;
        sourceWarnings.push(...master.warnings);
        doneStep(
          `Master · ${master.tabCount} tabs · ${master.teams.length} teams · ${master.games.length} games`,
        );
      }

      for (const [region, url] of regionalEntries) {
        let startIndex = 0;
        let tabCount = 0;
        let teamsLoaded = 0;
        let blocksLoaded = 0;
        const label = `${region.toUpperCase()} stats sheet`;

        bump(`Loading ${label}…`, "Fetching team tabs");

        for (;;) {
          const batch = await loadRegionalBatch.mutateAsync({
            url,
            region,
            startIndex,
            batchSize: 4,
            sessionId,
          });
          tabCount = batch.tabCount;
          teamsLoaded += batch.teams.length;
          blocksLoaded += batch.blocks.length;
          regionalTeams.push(...batch.teams);
          regionalBlocks.push(...batch.blocks);
          sourceWarnings.push(...batch.warnings);

          const loaded = Math.min(batch.nextIndex, batch.tabCount);
          bump(
            `Loading ${label}…`,
            `Tabs ${loaded}/${batch.tabCount}` +
              (batch.loadedTabs.length > 0 ? ` · ${batch.loadedTabs.join(", ")}` : ""),
          );

          if (batch.done) break;
          startIndex = batch.nextIndex;
        }

        doneStep(
          `${region.toUpperCase()} · ${tabCount} tabs · ${teamsLoaded} teams · ${blocksLoaded} game blocks`,
        );
      }

      bump("Building preview…", "Matching stats and checking existing players");
      const sources: StagedSources = {
        masterTeams,
        masterGames,
        regionalTeams,
        regionalBlocks,
        sourceWarnings,
      };

      const preview =
        input.mode === "full"
          ? await assemble.mutateAsync({
              mode: "full",
              seasonNumber: input.seasonNumber!,
              startDate: input.startDate!,
              endDate: input.endDate ?? null,
              theme: input.theme ?? null,
              sessionId,
            })
          : await assemble.mutateAsync({
              mode: input.mode,
              seasonId: input.seasonId!,
              sessionId,
            });

      doneStep(
        `Preview ready · ${preview.counts.teams} teams · ${preview.counts.players} players` +
          (input.mode === "full"
            ? ` · ${preview.counts.games} games · ${preview.counts.stats} stats`
            : ""),
      );

      setProgress(emptyProgress());
      return { preview: preview as Preview, sources, sessionId };
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      setProgress((current) => ({
        ...current,
        active: true,
        failed: true,
        label: "Import step failed",
        detail: detail.length > 160 ? `${detail.slice(0, 160)}…` : detail,
      }));
      throw error;
    }
  };

  return { run, progress, pending: loadMaster.isPending || loadRegionalBatch.isPending || assemble.isPending };
}

export function SeasonSheetImport() {
  const router = useRouter();
  const { showErrorDetail } = usePortalErrorToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "preview">("form");
  const [seasonNumber, setSeasonNumber] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [theme, setTheme] = useState("");
  const sheetUrls = useSheetUrls();
  const { masterUrl, naUrl, euUrl, asUrl } = sheetUrls;
  const [preview, setPreview] = useState<Preview | null>(null);
  const [importSessionId, setImportSessionId] = useState<string | null>(null);
  const [excludedTeams, setExcludedTeams] = useState<Set<string>>(new Set());
  const [excludedGames, setExcludedGames] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [lastImportError, setLastImportError] = useState<{ title: string; error: unknown } | null>(
    null,
  );

  const { run, progress } = useSheetPreviewLoader();
  const runCommit = trpc.seasons.commitSheetImport.useMutation();

  const reset = () => {
    setStep("form");
    setPreview(null);
    setImportSessionId(null);
    setExcludedTeams(new Set());
    setExcludedGames(new Set());
    setBusy(false);
  };

  const baseInput = useMemo(
    () => ({
      mode: "full" as const,
      seasonNumber: Number.parseInt(seasonNumber, 10),
      startDate,
      endDate: endDate || null,
      theme: theme || null,
      ...(importSessionId
        ? { sessionId: importSessionId }
        : { masterUrl, regionalUrls: regionalPayload(naUrl, euUrl, asUrl) }),
      excludeTeamKeys: [...excludedTeams],
      excludeGameKeys: [...excludedGames],
    }),
    [
      seasonNumber,
      startDate,
      endDate,
      theme,
      masterUrl,
      naUrl,
      euUrl,
      asUrl,
      excludedTeams,
      excludedGames,
      importSessionId,
    ],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <button type="button" className={buttonClass}>
          Import from Sheets
        </button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[92vh] w-[min(96vw,80rem)] max-w-7xl flex-col gap-4 overflow-y-auto p-5 sm:max-w-7xl">
        <DialogHeader>
          <DialogTitle>Import a season from Google Sheets</DialogTitle>
          <DialogDescription>
            Paste the master schedule sheet plus optional regional stats sheets, preview everything,
            then create Season N with teams, players, games, and stats.
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setLastImportError(null);
              try {
                const { preview: result, sessionId } = await run({
                  mode: "full",
                  seasonNumber: Number.parseInt(seasonNumber, 10),
                  startDate,
                  endDate: endDate || null,
                  theme: theme || null,
                  masterUrl,
                  regionalUrls: regionalPayload(naUrl, euUrl, asUrl),
                });
                setPreview(result);
                setImportSessionId(sessionId);
                setExcludedTeams(new Set());
                setExcludedGames(new Set());
                setStep("preview");
              } catch (error) {
                setLastImportError({ title: "Preview failed", error });
                showErrorDetail("Preview failed", error);
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sheet-season-number">Season number</Label>
                <Input
                  id="sheet-season-number"
                  type="number"
                  min={1}
                  required
                  value={seasonNumber}
                  onChange={(event) => setSeasonNumber(event.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sheet-theme">Theme</Label>
                <Input
                  id="sheet-theme"
                  value={theme}
                  onChange={(event) => setTheme(event.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sheet-start">Start date</Label>
                <Input
                  id="sheet-start"
                  type="date"
                  required
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sheet-end">End date</Label>
                <Input
                  id="sheet-end"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  disabled={busy}
                />
              </div>
            </div>
            <SheetUrlFields {...sheetUrls} masterRequired />
            <ImportProgress
              progress={progress}
              onViewError={
                lastImportError
                  ? () => showErrorDetail(lastImportError.title, lastImportError.error)
                  : undefined
              }
            />
            <DialogFooter className="-mx-5 -mb-5">
              <button type="submit" className={primaryClass} disabled={busy}>
                {busy ? "Working…" : "Preview"}
              </button>
            </DialogFooter>
          </form>
        ) : preview ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
            <SheetImportPreviewTables
              preview={preview}
              excludedTeams={excludedTeams}
              excludedGames={excludedGames}
              showGames
              onToggleTeam={(key) =>
                setExcludedTeams((current) => {
                  const next = new Set(current);
                  if (next.has(key)) next.delete(key);
                  else next.add(key);
                  return next;
                })
              }
              onToggleGame={(key) =>
                setExcludedGames((current) => {
                  const next = new Set(current);
                  if (next.has(key)) next.delete(key);
                  else next.add(key);
                  return next;
                })
              }
            />
            <DialogFooter className="-mx-5 -mb-5 shrink-0 gap-2 sm:justify-between">
              <button type="button" className={buttonClass} onClick={() => setStep("form")}>
                Back
              </button>
              <button
                type="button"
                className={primaryClass}
                disabled={runCommit.isPending || preview.errors.length > 0}
                onClick={async () => {
                  try {
                    const result = await runCommit.mutateAsync(baseInput);
                    toast.success(
                      `Season ${result.seasonNumber}: ${result.teamsCreated} teams, ${result.playersCreated} players, ${result.gamesCreated} games, ${result.statsCreated} stats`,
                    );
                    setOpen(false);
                    reset();
                    router.refresh();
                  } catch (error) {
                    setLastImportError({ title: "Import failed", error });
                    showErrorDetail("Import failed", error);
                  }
                }}
              >
                {runCommit.isPending ? "Importing…" : "Confirm import"}
              </button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function TeamsSheetImport({
  seasons,
}: {
  seasons: { id: number; label: string }[];
}) {
  const router = useRouter();
  const { showErrorDetail } = usePortalErrorToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "preview">("form");
  const [mode, setMode] = useState<TeamMode>("teams_and_players");
  const [seasonId, setSeasonId] = useState(seasons[0] ? String(seasons[0].id) : "");
  const sheetUrls = useSheetUrls();
  const { masterUrl, naUrl, euUrl, asUrl } = sheetUrls;
  const [preview, setPreview] = useState<Preview | null>(null);
  const [importSessionId, setImportSessionId] = useState<string | null>(null);
  const [excludedTeams, setExcludedTeams] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [lastImportError, setLastImportError] = useState<{ title: string; error: unknown } | null>(
    null,
  );

  const { run, progress } = useSheetPreviewLoader();
  const runCommit = trpc.teams.commitSheetImport.useMutation();

  const reset = () => {
    setStep("form");
    setPreview(null);
    setImportSessionId(null);
    setExcludedTeams(new Set());
    setBusy(false);
  };

  const baseInput = {
    mode,
    seasonId: Number.parseInt(seasonId, 10),
    ...(importSessionId
      ? { sessionId: importSessionId }
      : {
          ...(masterUrl ? { masterUrl } : {}),
          regionalUrls: regionalPayload(naUrl, euUrl, asUrl),
        }),
    excludeTeamKeys: [...excludedTeams],
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <button type="button" className={buttonClass}>
          Import from Sheets
        </button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[92vh] w-[min(96vw,80rem)] max-w-7xl flex-col gap-4 overflow-y-auto p-5 sm:max-w-7xl">
        <DialogHeader>
          <DialogTitle>Import teams from Google Sheets</DialogTitle>
          <DialogDescription>
            Build teams, build teams with rosters, or only attach players to teams that already exist
            in a season.
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setLastImportError(null);
              try {
                const { preview: result, sessionId: nextSessionId } = await run({
                  mode,
                  seasonId: Number.parseInt(seasonId, 10),
                  ...(masterUrl ? { masterUrl } : {}),
                  regionalUrls: regionalPayload(naUrl, euUrl, asUrl),
                });
                setPreview(result);
                setImportSessionId(nextSessionId);
                setExcludedTeams(new Set());
                setStep("preview");
              } catch (error) {
                setLastImportError({ title: "Preview failed", error });
                showErrorDetail("Preview failed", error);
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Season</Label>
                <PortalSelect
                  value={seasonId}
                  onChange={setSeasonId}
                  options={seasons.map((season) => ({
                    value: String(season.id),
                    label: season.label,
                  }))}
                  placeholder="Season"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Import mode</Label>
                <PortalSelect
                  value={mode}
                  onChange={(value) => setMode(value as TeamMode)}
                  options={[
                    { value: "teams", label: "Teams only" },
                    { value: "teams_and_players", label: "Teams + players" },
                    { value: "players", label: "Players only (existing teams)" },
                  ]}
                  placeholder="Mode"
                />
              </div>
            </div>
            <SheetUrlFields {...sheetUrls} masterRequired={false} />
            <ImportProgress
              progress={progress}
              onViewError={
                lastImportError
                  ? () => showErrorDetail(lastImportError.title, lastImportError.error)
                  : undefined
              }
            />
            <DialogFooter className="-mx-5 -mb-5">
              <button type="submit" className={primaryClass} disabled={busy}>
                {busy ? "Working…" : "Preview"}
              </button>
            </DialogFooter>
          </form>
        ) : preview ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
            <SheetImportPreviewTables
              preview={preview}
              excludedTeams={excludedTeams}
              excludedGames={new Set()}
              showGames={false}
              onToggleTeam={(key) =>
                setExcludedTeams((current) => {
                  const next = new Set(current);
                  if (next.has(key)) next.delete(key);
                  else next.add(key);
                  return next;
                })
              }
              onToggleGame={() => undefined}
            />
            <DialogFooter className="-mx-5 -mb-5 shrink-0 gap-2 sm:justify-between">
              <button type="button" className={buttonClass} onClick={() => setStep("form")}>
                Back
              </button>
              <button
                type="button"
                className={primaryClass}
                disabled={runCommit.isPending || preview.errors.length > 0}
                onClick={async () => {
                  try {
                    const result = await runCommit.mutateAsync(baseInput);
                    toast.success(
                      `${result.teamsCreated} teams, ${result.playersCreated} players created, ${result.playersAttached} attached`,
                    );
                    setOpen(false);
                    reset();
                    router.refresh();
                  } catch (error) {
                    setLastImportError({ title: "Import failed", error });
                    showErrorDetail("Import failed", error);
                  }
                }}
              >
                {runCommit.isPending ? "Importing…" : "Confirm import"}
              </button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
