import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, JoinTable, OneToMany, JoinColumn } from 'typeorm';
import type { Seasons } from '../seasons/season.entity.js';
import type { Teams } from '../teams/team.entity.js';
import type { Stats } from '../stats/stat.entity.js';

export enum GameStatus {
    SCHEDULED = 'scheduled',
    COMPLETED = 'completed'
}

export enum GamePhase {
    QUALIFIERS = 'qualifiers',
    PLAYOFFS = 'playoffs'
}

export enum GameRegion {
    NA = 'na',
    EU = 'eu',
    AS = 'as',
    SA = 'sa'
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

    @Column({ default: "Winners Bracket; Round of 16" })
    stage!: string;

    @Column({
        type: 'enum',
        enum: GameStatus,
        default: GameStatus.SCHEDULED
    })
    status!: GameStatus;

    @Column({ nullable: true })
    matchNumber!: string | null;

    @Column({ nullable: true })
    round!: string | null;

    @Column({
        type: 'enum',
        enum: GamePhase,
        default: GamePhase.QUALIFIERS
    })
    phase!: GamePhase;

    @Column({
        type: 'enum',
        enum: GameRegion,
        default: GameRegion.NA
    })
    region!: GameRegion;

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

    @Column({ nullable: true })
    challongeMatchId!: string | null;

    @Column({ nullable: true })
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
