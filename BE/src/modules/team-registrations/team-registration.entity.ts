import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import type { User } from '../user/user.entity.js';
import type { Region } from '../regions/region.entity.js';
import type { Seasons } from '../seasons/season.entity.js';
import type { Teams } from '../teams/team.entity.js';

export type TeamRegistrationStatus = 'pending' | 'conflict' | 'accepted' | 'denied';

export interface RosterEntry {
    discord: string;
    roblox: string;
}

@Entity()
@Index('IDX_team_registration_region_season', ['regionId', 'seasonId'])
@Index('IDX_team_registration_status', ['status'])
export class TeamRegistration {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    submittedByUserId!: number;

    @ManyToOne('User')
    @JoinColumn({ name: 'submittedByUserId' })
    submittedBy!: User;

    @Column()
    regionId!: number;

    @ManyToOne('Region')
    @JoinColumn({ name: 'regionId' })
    region!: Region;

    @Column()
    seasonId!: number;

    @ManyToOne('Seasons')
    @JoinColumn({ name: 'seasonId' })
    season!: Seasons;

    @Column()
    teamName!: string;

    @Column({ type: 'varchar' })
    hexColor!: string;

    @Column({ type: 'varchar' })
    brickColor!: string;

    @Column()
    captainDiscord!: string;

    @Column()
    captainRoblox!: string;

    @Column()
    viceDiscord!: string;

    @Column()
    viceRoblox!: string;

    @Column({ type: 'jsonb' })
    roster!: RosterEntry[];

    @Column({ default: false })
    agreeCivilScheduling!: boolean;

    @Column({ default: false })
    confidentWillParticipate!: boolean;

    @Column({ type: 'text', nullable: true })
    priorLeagueExperience!: string | null;

    @Column({ default: false })
    logoJerseyAck!: boolean;

    @Column({ type: 'varchar', default: 'pending' })
    status!: TeamRegistrationStatus;

    @Column({ type: 'int', nullable: true })
    createdTeamId!: number | null;

    @ManyToOne('Teams', { nullable: true })
    @JoinColumn({ name: 'createdTeamId' })
    createdTeam!: Teams | null;

    @Column({ type: 'jsonb', nullable: true })
    conflictPayload!: Record<string, unknown> | null;

    @Column({ default: false })
    captainLinkPending!: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;
}
