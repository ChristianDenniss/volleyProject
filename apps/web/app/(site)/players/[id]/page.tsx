import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@server/trpc/server";
import { roblox } from "@server/services";
import { PlayerProfile } from "@components/site/player-profile";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

const load = cache(async (id: string) => {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return (await api()).players.byId({ id: parsed });
});

const loadAvatar = cache(async (name: string, robloxUserId: string | null) => {
  try {
    return await roblox.avatarFor({ name, robloxUserId });
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const player = await load(id);
  if (!player) return { title: "Player not found" };

  const description = `${player.name} is a ${player.position} in the Roblox Volleyball League. View stats, teams, awards, and career highlights.`;
  const avatarUrl = await loadAvatar(player.name, player.robloxUserId);

  return {
    title: player.name,
    description,
    openGraph: {
      title: `${player.name} - Player Profile`,
      description,
      images: avatarUrl ? [avatarUrl] : undefined,
    },
  };
}

export default async function PlayerPage({ params }: Params) {
  const { id } = await params;
  const player = await load(id);
  if (!player) notFound();

  const trpc = await api();
  const [avatarUrl, seasons] = await Promise.all([
    loadAvatar(player.name, player.robloxUserId),
    trpc.seasons.list(),
  ]);

  const currentSeason =
    seasons.find((season) => season.endDate == null) ??
    seasons.reduce<(typeof seasons)[number] | null>(
      (latest, season) =>
        !latest || season.seasonNumber > latest.seasonNumber ? season : latest,
      null,
    );

  return (
    <PlayerProfile
      name={player.name}
      position={player.position}
      robloxUserId={player.robloxUserId}
      avatarUrl={avatarUrl}
      currentSeasonNumber={currentSeason?.seasonNumber ?? null}
      teams={player.teams.map((team) => ({
        id: team.id,
        name: team.name,
        placement: team.placement,
        seasonNumber: team.seasonNumber ?? null,
      }))}
      stats={player.stats.map((line) => ({
        id: line.id,
        gameId: line.gameId,
        gameName: line.gameName,
        gameDate: line.gameDate,
        seasonNumber: line.seasonNumber ?? null,
        spikeKills: line.spikeKills,
        spikeAttempts: line.spikeAttempts,
        spikingErrors: line.spikingErrors,
        apeKills: line.apeKills,
        apeAttempts: line.apeAttempts,
        assists: line.assists,
        settingErrors: line.settingErrors,
        blocks: line.blocks,
        blockFollows: line.blockFollows,
        digs: line.digs,
        aces: line.aces,
        servingErrors: line.servingErrors,
        miscErrors: line.miscErrors,
      }))}
      awards={player.awards.map((award) => ({
        id: award.id,
        type: award.type,
        seasonNumber: award.seasonNumber ?? null,
      }))}
    />
  );
}
