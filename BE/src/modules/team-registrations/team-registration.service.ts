import { Repository } from "typeorm";
import { AppDataSource } from "../../db/data-source.js";
import { TeamRegistration, RosterEntry } from "./team-registration.entity.js";
import { Seasons } from "../seasons/season.entity.js";
import { Teams } from "../teams/team.entity.js";
import { Players } from "../players/player.entity.js";
import { User } from "../user/user.entity.js";
import { RegionService } from "../regions/region.service.js";
import { RegionCode } from "../regions/region.entity.js";
import { UserService } from "../user/user.service.js";
import { normalizeRobloxUsername } from "../../middleware/authValidation.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { ConflictError } from "../../errors/ConflictError.js";
import { UnauthorizedError } from "../../errors/UnauthorizedError.js";
import type {
    CreateTeamRegistrationDto,
    UpdateTeamRegistrationDto,
    ResolveRegistrationDto,
} from "./team-registration.schema.js";

export interface NameConflict {
    type: "name";
    teamName: string;
    existingTeamId: number;
}

export interface PlayerConflict {
    type: "player";
    roblox: string;
    existingTeamId: number;
    existingTeamName: string;
    playerId: number;
}

export type RegistrationConflict = NameConflict | PlayerConflict;

function normalizeRoster(roster: RosterEntry[]): RosterEntry[] {
    return roster.map((r) => ({
        discord: r.discord.trim(),
        roblox: normalizeRobloxUsername(r.roblox),
    }));
}

export class TeamRegistrationService {
    private repo: Repository<TeamRegistration>;
    private seasonRepo: Repository<Seasons>;
    private teamRepo: Repository<Teams>;
    private playerRepo: Repository<Players>;
    private userRepo: Repository<User>;
    private regionService = new RegionService();
    private userService = new UserService();

    constructor() {
        this.repo = AppDataSource.getRepository(TeamRegistration);
        this.seasonRepo = AppDataSource.getRepository(Seasons);
        this.teamRepo = AppDataSource.getRepository(Teams);
        this.playerRepo = AppDataSource.getRepository(Players);
        this.userRepo = AppDataSource.getRepository(User);
    }

    private async openSeasonForRegion(regionCode: RegionCode): Promise<{ season: Seasons; regionId: number }> {
        const region = await this.regionService.requireRegionByCode(regionCode);
        const open = await this.seasonRepo.find({
            where: { regionId: region.id, registrationsOpen: true },
            order: { seasonNumber: "DESC" },
        });
        if (open.length === 0) {
            throw new ConflictError("Team registrations are not open for this region");
        }
        if (open.length > 1) {
            throw new ConflictError("Multiple seasons have registrations open; ask an admin to fix this");
        }
        return { season: open[0], regionId: region.id };
    }

    async submit(userId: number, dto: CreateTeamRegistrationDto): Promise<TeamRegistration> {
        const { season, regionId } = await this.openSeasonForRegion(dto.region);

        const active = await this.repo.findOne({
            where: [
                { submittedByUserId: userId, seasonId: season.id, status: "pending" },
                { submittedByUserId: userId, seasonId: season.id, status: "conflict" },
                { submittedByUserId: userId, seasonId: season.id, status: "accepted" },
            ],
        });
        if (active?.status === "accepted") {
            throw new ConflictError("You already have an accepted team in this region/season");
        }
        if (active) {
            throw new ConflictError("You already have an active application for this region/season");
        }

        const row = new TeamRegistration();
        row.submittedByUserId = userId;
        row.regionId = regionId;
        row.seasonId = season.id;
        row.teamName = dto.teamName.trim();
        row.hexColor = dto.hexColor;
        row.brickColor = dto.brickColor.trim();
        row.captainDiscord = dto.captainDiscord.trim();
        row.captainRoblox = normalizeRobloxUsername(dto.captainRoblox);
        row.viceDiscord = dto.viceDiscord.trim();
        row.viceRoblox = normalizeRobloxUsername(dto.viceRoblox);
        row.roster = normalizeRoster(dto.roster);
        row.agreeCivilScheduling = true;
        row.confidentWillParticipate = true;
        row.priorLeagueExperience = dto.priorLeagueExperience?.trim() || null;
        row.logoJerseyAck = true;
        row.status = "pending";

        return await this.repo.save(row);
    }

    async updatePending(userId: number, id: number, dto: UpdateTeamRegistrationDto): Promise<TeamRegistration> {
        const row = await this.requireOwned(userId, id);
        if (row.status !== "pending") {
            throw new ConflictError("Only pending applications can be edited");
        }

        if (dto.teamName !== undefined) row.teamName = dto.teamName.trim();
        if (dto.hexColor !== undefined) row.hexColor = dto.hexColor;
        if (dto.brickColor !== undefined) row.brickColor = dto.brickColor.trim();
        if (dto.captainDiscord !== undefined) row.captainDiscord = dto.captainDiscord.trim();
        if (dto.captainRoblox !== undefined) row.captainRoblox = normalizeRobloxUsername(dto.captainRoblox);
        if (dto.viceDiscord !== undefined) row.viceDiscord = dto.viceDiscord.trim();
        if (dto.viceRoblox !== undefined) row.viceRoblox = normalizeRobloxUsername(dto.viceRoblox);
        if (dto.roster !== undefined) row.roster = normalizeRoster(dto.roster);
        if (dto.priorLeagueExperience !== undefined) {
            row.priorLeagueExperience = dto.priorLeagueExperience?.trim() || null;
        }
        if (dto.agreeCivilScheduling !== undefined) row.agreeCivilScheduling = dto.agreeCivilScheduling;
        if (dto.confidentWillParticipate !== undefined) {
            row.confidentWillParticipate = dto.confidentWillParticipate;
        }
        if (dto.logoJerseyAck !== undefined) row.logoJerseyAck = dto.logoJerseyAck;

        return await this.repo.save(row);
    }

    async withdraw(userId: number, id: number): Promise<void> {
        const row = await this.requireOwned(userId, id);
        if (row.status !== "pending" && row.status !== "conflict") {
            throw new ConflictError("Only pending or conflict applications can be withdrawn");
        }
        await this.repo.remove(row);
    }

    private async requireOwned(userId: number, id: number): Promise<TeamRegistration> {
        const row = await this.repo.findOne({ where: { id } });
        if (!row) throw new NotFoundError("Registration not found");
        if (row.submittedByUserId !== userId) throw new UnauthorizedError("Not your registration");
        return row;
    }

    async list(filters: {
        regionId?: number;
        region?: RegionCode;
        seasonId?: number;
        status?: string;
    }): Promise<TeamRegistration[]> {
        let regionId = filters.regionId;
        if (!regionId && filters.region) {
            regionId = (await this.regionService.requireRegionByCode(filters.region)).id;
        }

        const qb = this.repo
            .createQueryBuilder("r")
            .leftJoinAndSelect("r.region", "region")
            .leftJoinAndSelect("r.season", "season")
            .leftJoinAndSelect("r.submittedBy", "submittedBy")
            .orderBy("CASE WHEN r.status = 'accepted' THEN 0 ELSE 1 END", "ASC")
            .addOrderBy("r.createdAt", "ASC");

        if (regionId) qb.andWhere("r.regionId = :regionId", { regionId });
        if (filters.seasonId) qb.andWhere("r.seasonId = :seasonId", { seasonId: filters.seasonId });
        if (filters.status) qb.andWhere("r.status = :status", { status: filters.status });

        return qb.getMany();
    }

    toPublicDto(row: TeamRegistration) {
        return {
            id: row.id,
            teamName: row.teamName,
            captainDiscord: row.captainDiscord,
            captainRoblox: row.captainRoblox,
            status: row.status,
            regionId: row.regionId,
            seasonId: row.seasonId,
            region: row.region,
            season: row.season
                ? {
                      id: row.season.id,
                      seasonNumber: row.season.seasonNumber,
                      startDate: row.season.startDate,
                      maxTeams: row.season.maxTeams,
                      registrationsOpen: row.season.registrationsOpen,
                  }
                : undefined,
            createdAt: row.createdAt,
        };
    }

    toDetailDto(row: TeamRegistration, includeAdmin = false) {
        const base = {
            ...this.toPublicDto(row),
            hexColor: row.hexColor,
            brickColor: row.brickColor,
            viceDiscord: row.viceDiscord,
            viceRoblox: row.viceRoblox,
            roster: row.roster,
            agreeCivilScheduling: row.agreeCivilScheduling,
            confidentWillParticipate: row.confidentWillParticipate,
            priorLeagueExperience: row.priorLeagueExperience,
            logoJerseyAck: row.logoJerseyAck,
            createdTeamId: row.createdTeamId,
            captainLinkPending: row.captainLinkPending,
            submittedByUserId: row.submittedByUserId,
            submittedBy: row.submittedBy
                ? { id: row.submittedBy.id, username: row.submittedBy.username }
                : undefined,
        };
        if (includeAdmin) {
            return { ...base, conflictPayload: row.conflictPayload };
        }
        return base;
    }

    async getById(id: number): Promise<TeamRegistration> {
        const row = await this.repo.findOne({
            where: { id },
            relations: ["region", "season", "submittedBy", "createdTeam"],
        });
        if (!row) throw new NotFoundError("Registration not found");
        return row;
    }

    async summary(region?: RegionCode, seasonId?: number) {
        let regionId: number | undefined;
        if (region) regionId = (await this.regionService.requireRegionByCode(region)).id;

        let season: Seasons | null = null;
        if (seasonId) {
            season = await this.seasonRepo.findOne({ where: { id: seasonId } });
        } else if (regionId) {
            season = await this.seasonRepo.findOne({
                where: { regionId, registrationsOpen: true },
                order: { seasonNumber: "DESC" },
            });
            if (!season) {
                season = await this.seasonRepo.findOne({
                    where: { regionId },
                    order: { seasonNumber: "DESC" },
                });
            }
        }

        if (!season) {
            return { accepted: 0, spotsLeft: null, capacity: null, seasonId: null };
        }

        const accepted = await this.repo.count({
            where: { seasonId: season.id, status: "accepted" },
        });
        const capacity = season.maxTeams;
        const spotsLeft = capacity != null ? Math.max(0, capacity - accepted) : null;
        return {
            accepted,
            spotsLeft,
            capacity,
            seasonId: season.id,
            startDate: season.startDate,
            registrationsOpen: season.registrationsOpen,
            seasonNumber: season.seasonNumber,
        };
    }

    async detectConflicts(
        seasonId: number,
        regionId: number,
        teamName: string,
        roster: RosterEntry[],
        excludeTeamId?: number | null
    ): Promise<RegistrationConflict[]> {
        const conflicts: RegistrationConflict[] = [];

        const nameTeam = await this.teamRepo.findOne({
            where: { name: teamName, regionId, season: { id: seasonId } },
            relations: ["season"],
        });
        if (nameTeam && nameTeam.id !== excludeTeamId) {
            conflicts.push({ type: "name", teamName, existingTeamId: nameTeam.id });
        }

        for (const entry of roster) {
            const roblox = normalizeRobloxUsername(entry.roblox);
            const player = await this.playerRepo.findOne({
                where: { robloxUsername: roblox },
                relations: ["teams", "teams.season"],
            });
            if (!player?.teams?.length) continue;
            const other = player.teams.find(
                (t) => t.season?.id === seasonId && t.id !== excludeTeamId
            );
            if (other) {
                conflicts.push({
                    type: "player",
                    roblox,
                    existingTeamId: other.id,
                    existingTeamName: other.name,
                    playerId: player.id,
                });
            }
        }

        return conflicts;
    }

    async tryAccept(
        id: number,
        adminId: number,
        options?: { teamName?: string; exclusions?: Set<string>; transfers?: Set<string> }
    ): Promise<{ ok: true; registration: TeamRegistration; team: Teams } | { ok: false; conflicts: RegistrationConflict[]; registration: TeamRegistration }> {
        const row = await this.getById(id);
        if (row.status === "accepted") throw new ConflictError("Already accepted");
        if (row.status === "denied") throw new ConflictError("Registration is denied");

        let roster = [...row.roster];
        const teamName = options?.teamName?.trim() || row.teamName;

        if (options?.exclusions?.size) {
            roster = roster.filter((r) => !options.exclusions!.has(normalizeRobloxUsername(r.roblox)));
        }
        if (roster.length < 10) {
            throw new ConflictError("Roster must have at least 10 players after exclusions");
        }

        const conflicts = await this.detectConflicts(row.seasonId, row.regionId, teamName, roster, row.createdTeamId);
        const remaining = conflicts.filter((c) => {
            if (c.type === "player" && options?.transfers?.has(c.roblox)) return false;
            if (c.type === "player" && options?.exclusions?.has(c.roblox)) return false;
            if (c.type === "name" && options?.teamName && options.teamName.trim() !== row.teamName) {
                return c.teamName === options.teamName.trim();
            }
            return true;
        });

        // Re-detect after applying transfer intent conceptually
        const effectiveConflicts: RegistrationConflict[] = [];
        for (const c of conflicts) {
            if (c.type === "name") {
                if (options?.teamName && normalizeRobloxUsername(options.teamName) !== normalizeRobloxUsername(row.teamName)) {
                    const still = await this.teamRepo.findOne({
                        where: { name: teamName, regionId: row.regionId, season: { id: row.seasonId } },
                    });
                    if (still) effectiveConflicts.push({ type: "name", teamName, existingTeamId: still.id });
                } else {
                    effectiveConflicts.push(c);
                }
            } else if (c.type === "player") {
                if (options?.exclusions?.has(c.roblox)) continue;
                if (options?.transfers?.has(c.roblox)) continue;
                effectiveConflicts.push(c);
            }
        }

        if (effectiveConflicts.length > 0) {
            row.status = "conflict";
            row.conflictPayload = { conflicts: effectiveConflicts };
            if (options?.teamName) row.teamName = teamName;
            await this.repo.save(row);
            return { ok: false, conflicts: effectiveConflicts, registration: row };
        }

        // Apply transfers
        if (options?.transfers?.size) {
            for (const roblox of options.transfers) {
                const player = await this.playerRepo.findOne({
                    where: { robloxUsername: roblox },
                    relations: ["teams", "teams.season"],
                });
                if (!player) continue;
                player.teams = (player.teams || []).filter((t) => t.season?.id !== row.seasonId);
                await this.playerRepo.save(player);
            }
        }

        if (options?.teamName) row.teamName = teamName;
        row.roster = roster;

        const team = new Teams();
        team.name = row.teamName;
        team.hexColor = row.hexColor;
        team.brickColor = row.brickColor;
        team.regionId = row.regionId;
        team.season = row.season;
        team.captainEditEnabled = true;
        team.placement = "Didnt make playoffs";

        const linkedCaptain = await this.userRepo.findOne({
            where: { robloxUsername: row.captainRoblox },
        });
        if (linkedCaptain) {
            team.captainUserId = linkedCaptain.id;
            row.captainLinkPending = false;
        } else {
            team.captainUserId = row.submittedByUserId;
            row.captainLinkPending = true;
        }

        const players: Players[] = [];
        for (const entry of roster) {
            let player = await this.playerRepo.findOne({
                where: { robloxUsername: entry.roblox },
                relations: ["teams"],
            });
            if (!player) {
                player = new Players();
                player.name = entry.roblox;
                player.robloxUsername = entry.roblox;
                player.discordUsername = entry.discord;
                player.position = "N/A";
                player.teams = [];
            } else {
                player.discordUsername = entry.discord;
                if (!player.teams) player.teams = [];
            }
            const linkedUser = await this.userRepo.findOne({ where: { robloxUsername: entry.roblox } });
            if (linkedUser) {
                player.userId = linkedUser.id;
                player.robloxUserId = linkedUser.robloxUserId;
            }
            players.push(await this.playerRepo.save(player));
        }

        team.players = players;
        const savedTeam = await this.teamRepo.save(team);

        row.status = "accepted";
        row.createdTeamId = savedTeam.id;
        row.conflictPayload = null;
        await this.repo.save(row);

        const captainId = team.captainUserId!;
        await this.userService.promoteRoleIfUser(captainId, "captain", adminId);

        // TODO: Google Sheets sync (name, brick, hex, region) when sheet exists

        return { ok: true, registration: row, team: savedTeam };
    }

    async resolve(id: number, adminId: number, dto: ResolveRegistrationDto) {
        if (dto.decision === "pending") {
            const row = await this.getById(id);
            row.status = "pending";
            row.conflictPayload = null;
            return { registration: await this.repo.save(row) };
        }
        if (dto.decision === "denied") {
            return { registration: await this.deny(id) };
        }

        const exclusions = new Set(
            (dto.players || []).filter((p) => p.action === "exclude").map((p) => normalizeRobloxUsername(p.roblox))
        );
        const transfers = new Set(
            (dto.players || []).filter((p) => p.action === "transfer").map((p) => normalizeRobloxUsername(p.roblox))
        );

        return this.tryAccept(id, adminId, {
            teamName: dto.teamName,
            exclusions,
            transfers,
        });
    }

    async deny(id: number): Promise<TeamRegistration> {
        const row = await this.getById(id);
        if (row.status === "accepted") {
            throw new ConflictError("Use revoke while registrations are open to undo an accepted application");
        }
        row.status = "denied";
        row.conflictPayload = null;
        return await this.repo.save(row);
    }

    async revoke(id: number): Promise<TeamRegistration> {
        const row = await this.getById(id);
        if (row.status !== "accepted") {
            throw new ConflictError("Only accepted registrations can be revoked");
        }
        const season = await this.seasonRepo.findOne({ where: { id: row.seasonId } });
        if (!season?.registrationsOpen) {
            throw new ConflictError(
                "Application process is closed; leave the team archived for season records"
            );
        }

        row.status = "denied";
        // Keep created team for history but clear link optional — plan says prefer status change;
        // leave team as-is in DB for archive during open period we still deny the registration.
        await this.repo.save(row);
        return row;
    }
}
