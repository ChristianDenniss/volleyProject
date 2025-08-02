import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import type { Seasons } from '../seasons/season.entity.js';

export enum MatchStatus {
    SCHEDULED = 'scheduled',
    COMPLETED = 'completed'
}

@Entity()
export class Matches {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    matchNumber!: string; // e.g., "Round 1 - Match 1"

    @Column({
        type: 'enum',
        enum: MatchStatus,
        default: MatchStatus.SCHEDULED
    })
    status!: MatchStatus;

    @Column()
    round!: string; // e.g., "Round 1", "Semi-Finals"

    @Column()
    date!: Date; // Single date field that can be updated

    @Column({ nullable: true })
    team1Score!: number; // Overall sets won by team1

    @Column({ nullable: true })
    team2Score!: number; // Overall sets won by team2

    // Set score columns (e.g., "25-20", "20-25", "25-22")
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
    challongeMatchId!: string; // ID from Challonge API

    @Column({ nullable: true })
    challongeTournamentId!: string; // Tournament ID from Challonge

    @Column({ nullable: true })
    challongeRound!: number; // Round number from Challonge

    @Column({ nullable: true, type: 'simple-array' })
    tags!: string[]; // Array of tags like ["RVL", "Invitational", "D-League"]

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    // Many-to-one relationship with seasons
    @ManyToOne('Seasons', 'matches')
    season!: Seasons;

    // Team names as strings (auto-filled from Challonge)
    @Column({ nullable: true })
    team1Name!: string;

    @Column({ nullable: true })
    team2Name!: string;
} 