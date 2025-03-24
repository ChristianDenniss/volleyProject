import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import type { Teams } from '../teams/team.entity.js';
import type { Games } from '../games/game.entity.js';

@Entity()
export class Seasons {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    seasonNumber!: number;

    @Column()
    startDate!: Date;

    @Column()
    endDate!: Date;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    // One-to-many relationship with teams, a season can have many teams
    @OneToMany('Teams', 'season')
    teams!: Teams[];

    // One-to-many relationship with games, a season can have many games
    @OneToMany('Games', 'season')
    games!: Games[];
}