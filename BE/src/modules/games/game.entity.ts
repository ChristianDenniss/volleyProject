import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, JoinTable, OneToMany, JoinColumn } from 'typeorm';
import type { Seasons } from '../seasons/season.entity.js';
import type { Teams } from '../teams/team.entity.js';
import type { Stats } from '../stats/stat.entity.js';
import type { Region } from '../regions/region.entity.js';

export enum GameStatus {
    SCHEDULED = 'scheduled',
    COMPLETED = 'completed'
}

export enum GamePhase {
    QUALIFIERS = 'qualifiers',
    PLAYOFFS = 'playoffs',
    PRE_SEASON = 'pre_season',
}

/** Double-elimination side; null for qualifiers, pre-season, grand finals, etc. */
export enum GameBracket {
    WINNERS = 'winners',
    LOSERS = 'losers',
}

@Entity()
export class Games {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ nullable: true, type: 'int' })
    team1Score!: number | null;

    @Column({ nullable: true, type: 'int' })
    team2Score!: number | null;

    @Column()
    date!: Date;

    @Column({ nullable: true, type: 'varchar' })
    name!: string | null;

    @Column({ default: null })
    videoUrl!: string;

    @Column({ default: "Round 1" })
    stage!: string;

    @Column({
        type: 'enum',
        enum: GameStatus,
        default: GameStatus.SCHEDULED
    })
    status!: GameStatus;

    @Column({
        type: 'enum',
        enum: GamePhase,
        default: GamePhase.QUALIFIERS
    })
    phase!: GamePhase;

    @Column({
        type: 'enum',
        enum: GameBracket,
        nullable: true,
    })
    bracket!: GameBracket | null;

    @Column()
    regionId!: number;

    @ManyToOne('Region')
    @JoinColumn({ name: 'regionId' })
    region!: Region;

    @Column({ nullable: true, type: 'varchar' })
    set1Score!: string | null;

    @Column({ nullable: true, type: 'varchar' })
    set2Score!: string | null;

    @Column({ nullable: true, type: 'varchar' })
    set3Score!: string | null;

    @Column({ nullable: true, type: 'varchar' })
    set4Score!: string | null;

    @Column({ nullable: true, type: 'varchar' })
    set5Score!: string | null;

    @Column({ nullable: true, type: 'varchar' })
    challongeMatchId!: string | null;

    @Column({ nullable: true, type: 'varchar' })
    challongeTournamentId!: string | null;

    @Column({ nullable: true, type: 'int' })
    challongeRound!: number | null;

    @Column({ nullable: true, type: 'simple-array' })
    tags!: string[] | null;

    @Column({ nullable: true, type: 'int' })
    winnerTeamId!: number | null;

    @ManyToOne('Teams', { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'winnerTeamId' })
    winner!: Teams | null;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    @ManyToOne('Seasons', 'games')
    season!: Seasons;

    @ManyToMany('Teams', 'games')
    @JoinTable({ name: 'teams_games' })
    teams!: Teams[];

    @OneToMany('Stats', 'game')
    stats!: Stats[];
}
