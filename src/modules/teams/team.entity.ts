import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, ManyToMany } from 'typeorm';
import type { Seasons } from '../seasons/season.entity.js';
import type { Players } from '../players/player.entity.js';
import type { Games } from '../games/game.entity.js';

@Entity()
export class Teams {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    // Many-to-one relationship with seasons
    @ManyToOne('Seasons', 'teams')
    season!: Seasons;

    // One-to-many relationship with players
    @OneToMany('Players', 'team')
    players!: Players[];

    @ManyToMany('Games', 'teams')
    games!: Games[];
}