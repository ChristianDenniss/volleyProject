import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, ManyToMany } from 'typeorm';
import { Seasons } from '../seasons/season.entity.js';
import { Players } from '../players/player.entity.js';
import { Games } from '../games/game.entity.js';

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
    @ManyToOne(() => Seasons, (season) => season.teams)
    season!: Seasons;

    // One-to-many relationship with players
    @OneToMany(() => Players, (player) => player.team)
    players!: Players[];

    @ManyToMany(() => Games, (game) => game.teams)
    games!: Games[];
}
