import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import type { Games } from '../games/game.entity.js';
import type { Teams } from '../teams/team.entity.js';
import type { Matches } from '../matches/match.entity.js';

@Entity()
export class Seasons {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    seasonNumber!: number;

    @Column()
    startDate!: Date;

    @Column({ nullable: true })
    endDate!: Date;

    @Column({ nullable: true })
    image!: string;

    @Column({ nullable: true })
    theme!: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    // One-to-many relationships
    @OneToMany('Games', 'season')
    games!: Games[];

    @OneToMany('Teams', 'season')
    teams!: Teams[];

    @OneToMany('Matches', 'season')
    matches!: Matches[];
}