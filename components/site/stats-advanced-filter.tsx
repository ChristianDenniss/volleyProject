"use client";

import { cn } from "@/lib/utils";
import type { LeaderboardRow } from "./stats-leaderboard";

export type StatType = "total" | "perGame" | "perSet";

export type ComparisonOperator = "==" | "!=" | ">" | ">=" | "<" | "<=";

export type FilterStatKey =
  | "spikeKills"
  | "spikeAttempts"
  | "Spike%"
  | "apeKills"
  | "apeAttempts"
  | "Ape%"
  | "totalKills"
  | "totalAttempts"
  | "totalSpike%"
  | "spikingErrors"
  | "blocks"
  | "assists"
  | "settingErrors"
  | "digs"
  | "blockFollows"
  | "totalReceives"
  | "aces"
  | "servingErrors"
  | "PRF"
  | "plusMinus"
  | "totalErrors"
  | "miscErrors"
  | "gamesPlayed";

export interface FilterCondition {
  id: string;
  stat: FilterStatKey;
  operator: ComparisonOperator;
  value: number;
}

export const FILTER_STAT_OPTIONS: { key: FilterStatKey; label: string }[] = [
  { key: "spikeKills", label: "Spike Kills" },
  { key: "spikeAttempts", label: "Spike Attempts" },
  { key: "Spike%", label: "Spike %" },
  { key: "apeKills", label: "Ape Kills" },
  { key: "apeAttempts", label: "Ape Attempts" },
  { key: "Ape%", label: "Ape %" },
  { key: "totalKills", label: "Total Kills" },
  { key: "totalAttempts", label: "Total Attempts" },
  { key: "totalSpike%", label: "Total Spike %" },
  { key: "spikingErrors", label: "Spiking Errors" },
  { key: "blocks", label: "Blocks" },
  { key: "assists", label: "Assists" },
  { key: "settingErrors", label: "Setting Errors" },
  { key: "digs", label: "Digs" },
  { key: "blockFollows", label: "Block Follows" },
  { key: "totalReceives", label: "Total Receives" },
  { key: "aces", label: "Aces" },
  { key: "servingErrors", label: "Serving Errors" },
  { key: "PRF", label: "PRF" },
  { key: "plusMinus", label: "Plus Minus" },
  { key: "totalErrors", label: "Total Errors" },
  { key: "miscErrors", label: "Misc Errors" },
  { key: "gamesPlayed", label: "Games Played" },
];

const PERCENTAGE_STATS = new Set<FilterStatKey>(["Spike%", "Ape%", "totalSpike%"]);
const RATE_STATS = PERCENTAGE_STATS;

function rawStatValue(row: LeaderboardRow, stat: FilterStatKey): number {
  switch (stat) {
    case "Spike%":
      return row.spikeAttempts === 0 ? 0 : (row.spikeKills / row.spikeAttempts) * 100;
    case "Ape%":
      return row.apeAttempts === 0 ? 0 : (row.apeKills / row.apeAttempts) * 100;
    case "totalSpike%":
      return row.spikingPercentage;
    case "totalReceives":
      return row.digs + row.blockFollows;
    case "PRF":
      return row.totalKills + row.aces + row.assists;
    case "plusMinus":
      return row.totalKills + row.aces + row.assists - row.totalErrors;
    default:
      return row[stat];
  }
}

export function getRowStatValue(
  row: LeaderboardRow,
  stat: FilterStatKey,
  statType: StatType = "total",
): number {
  const raw = rawStatValue(row, stat);
  if (RATE_STATS.has(stat) || statType === "total") return raw;
  if (statType === "perGame") {
    return row.gamesPlayed === 0 ? 0 : raw / row.gamesPlayed;
  }
  return row.totalSets === 0 ? 0 : raw / row.totalSets;
}

export function passesFilterConditions(
  row: LeaderboardRow,
  conditions: FilterCondition[],
  statType: StatType = "total",
): boolean {
  if (conditions.length === 0) return true;

  return conditions.every((condition) => {
    const statValue = getRowStatValue(row, condition.stat, statType);

    switch (condition.operator) {
      case "==":
        return Math.abs(statValue - condition.value) < 0.001;
      case "!=":
        return Math.abs(statValue - condition.value) >= 0.001;
      case ">":
        return statValue > condition.value;
      case ">=":
        return statValue >= condition.value;
      case "<":
        return statValue < condition.value;
      case "<=":
        return statValue <= condition.value;
      default:
        return true;
    }
  });
}

const fieldClass =
  "rounded-xs border border-rvl-line bg-transparent px-2.5 py-2 font-mono text-[0.76rem] text-rvl-ink transition-colors focus:border-rvl-accent-soft focus:outline-none";

function FilterConditionCard({
  condition,
  index,
  onUpdate,
  onRemove,
}: {
  condition: FilterCondition;
  index: number;
  onUpdate: (updates: Partial<FilterCondition>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xs bg-rvl-panel p-3">
      {index > 0 ? (
        <span className="mb-2 block font-mono text-[0.58rem] font-bold uppercase tracking-[0.18em] text-rvl-accent">
          And
        </span>
      ) : null}

      <div className="flex min-w-0 items-center gap-2">
        <select
          value={condition.stat}
          onChange={(event) => onUpdate({ stat: event.target.value as FilterStatKey })}
          className={cn(fieldClass, "min-w-0 flex-1")}
        >
          {FILTER_STAT_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={condition.operator}
          onChange={(event) =>
            onUpdate({ operator: event.target.value as ComparisonOperator })
          }
          className={cn(fieldClass, "w-14 shrink-0 px-1 text-center")}
        >
          <option value="==">=</option>
          <option value="!=">≠</option>
          <option value=">">&gt;</option>
          <option value=">=">≥</option>
          <option value="<">&lt;</option>
          <option value="<=">≤</option>
        </select>

        <div className="relative shrink-0">
          <input
            type="number"
            value={
              PERCENTAGE_STATS.has(condition.stat)
                ? Math.round(condition.value * 100) / 100
                : condition.value
            }
            onChange={(event) => {
              const inputValue = Number.parseFloat(event.target.value) || 0;
              onUpdate({ value: inputValue });
            }}
            className={cn(
              fieldClass,
              "w-16 text-center tabular-nums",
              PERCENTAGE_STATS.has(condition.stat) && "pr-5",
            )}
            step={PERCENTAGE_STATS.has(condition.stat) ? "0.01" : "1"}
            min="0"
            max={PERCENTAGE_STATS.has(condition.stat) ? "100" : undefined}
          />
          {PERCENTAGE_STATS.has(condition.stat) ? (
            <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 font-mono text-[0.68rem] text-rvl-dim">
              %
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 cursor-pointer rounded-xs border border-rvl-line px-2.5 py-2 font-mono text-[0.78rem] text-rvl-dim transition-colors hover:border-red-500/40 hover:text-red-400"
          aria-label="Remove filter"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function StatsAdvancedFilter({
  conditions,
  onConditionsChange,
}: {
  conditions: FilterCondition[];
  onConditionsChange: (conditions: FilterCondition[]) => void;
}) {
  const addCondition = () => {
    onConditionsChange([
      ...conditions,
      { id: String(Date.now()), stat: "totalKills", operator: ">", value: 0 },
    ]);
  };

  const removeCondition = (id: string) => {
    onConditionsChange(conditions.filter((condition) => condition.id !== id));
  };

  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    onConditionsChange(
      conditions.map((condition) =>
        condition.id === id ? { ...condition, ...updates } : condition,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="m-0 font-mono text-[0.72rem] font-bold uppercase tracking-[0.2em] text-rvl-accent">
          Advanced filters
        </h3>
        <button
          type="button"
          onClick={addCondition}
          className="cursor-pointer rounded-xs border border-rvl-accent-soft bg-rvl-accent-soft px-3 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-ink transition-colors hover:border-rvl-accent hover:text-rvl-accent"
        >
          + Add filter
        </button>
      </div>

      {conditions.length === 0 ? (
        <p className="m-0 px-4 py-5 text-center text-[0.9rem] italic text-rvl-dim">
          No filters applied. Click &quot;Add filter&quot; to create conditions.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {conditions.map((condition, index) => (
            <FilterConditionCard
              key={condition.id}
              condition={condition}
              index={index}
              onUpdate={(updates) => updateCondition(condition.id, updates)}
              onRemove={() => removeCondition(condition.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
