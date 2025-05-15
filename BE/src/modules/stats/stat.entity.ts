import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import type { Players } from '../players/player.entity.js';
import type { Games } from '../games/game.entity.js';

@Entity()
export class Stats {
    @PrimaryGeneratedColumn()
    id!: number;
    
    @Column()
    spikingErrors!: number;

    @Column()
    apeKills!: number;

    @Column()
    apeAttempts!: number;

    @Column()
    spikeKills!: number;

    @Column()
    spikeAttempts!: number;

    @Column()
    assists!: number;

    @Column()
    blocks!: number;

    @Column()
    digs!: number;

    @Column()
    blockFollows!: number;

    @Column()
    aces!: number;

    @Column()
    miscErrors!: number;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    // Many-to-one relationship with players, each stat belongs to one player
    @ManyToOne('Players', 'stats')
    player!: Players;

    // Many-to-one relationship with games, each stat is for one game
    @ManyToOne('Games', 'stats')
    game!: Games;
}