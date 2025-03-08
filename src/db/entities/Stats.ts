import {Entity, PrimaryGeneratedColumn, Column, Unique, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm'
import { Players } from './Players';
import { Games } from './Games';

@Entity()

export class Stats
{
    // I'm using the ! because TS is on strict mode and it doesnt like that the variable isnt intialized
    // The ! is promising it will get initialized later on
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
    blocks!: number;

    @Column()
    assists!: number;

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

    @ManyToOne(() => Games, (game) => game.stats, { onDelete: 'CASCADE' })
    game!: Games;

    @ManyToOne(() => Players, (player) => player.stats, { onDelete: 'CASCADE' })
    player!: Players;

}