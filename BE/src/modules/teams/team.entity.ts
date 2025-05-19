import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm';
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

    @Column({default: "Didnt make playoffs"})
    placement!: string;

    // Many-to-one relationship with seasons
    @ManyToOne('Seasons', 'teams')
    season!: Seasons;

    @ManyToMany('Players', 'teams')
    @JoinTable({
        name: 'teams_players', // Explicitly specify the name of the join table
    })
    players!: Players[];

    @ManyToMany('Games', 'teams')
    @JoinTable({
        name: 'teams_games', // Explicitly specify the name of the join table
    })
    games!: Games[];

}