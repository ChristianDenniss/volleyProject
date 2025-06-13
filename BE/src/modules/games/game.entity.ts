import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import type { Seasons } from '../seasons/season.entity.ts';
import type { Teams } from '../teams/team.entity.ts';
import type { Stats } from '../stats/stat.entity.ts';

@Entity()
export class Games {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    team1Score!: number;

    @Column()
    team2Score!: number;

    @Column()
    date!: Date;

    @Column({ nullable: true })
    name!: string;  // Store the concatenated team names, "Vs.", and season ID

    @Column({ default: null })
    videoUrl!: string;

    @Column({ default: "Winners Bracket; Round of 16" })
    stage!: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    // Many-to-one relationship with seasons, each game belongs to one season
    @ManyToOne('Seasons', 'games')
    season!: Seasons;

    // Many-to-many relationship with teams, a game can have multiple teams
    @ManyToMany('Teams', 'games')
    teams!: Teams[];

    // One-to-many relationship with stats, a game can have many stats entries
    @OneToMany('Stats', 'game')
    stats!: Stats[];
}