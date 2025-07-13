import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, RelationId } from 'typeorm';
import type { Players } from '../players/player.entity.js';
import type { Seasons } from '../seasons/season.entity.js';

@Entity()
export class Records {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: 'enum',
        enum: ['most spike kills', 'most assists', 'most ape kills', 'most digs', 'most block follows', 'most blocks', 'most aces', 'most serve errors',
            'most misc errors', 'most set errors', 'most spike errors', 'most spike attempts', 'most ape attempts', 'most total kills', 
            'most total attempts', 'most total errors', 'best total spiking % with 10+ attempts', 'best total spiking % with 20+ attempts', 
            'best total spiking % with 30+ attempts', 'best total spiking % with 40+ attempts', 'best total spiking % with 50+ attempts', 
            'best total spiking % with 60+ attempts', 'best total spiking % with 70+ attempts', 'best total spiking % with 80+ attempts', 
            'best total spiking % with 90+ attempts', 'best total spiking % with 100+ attempts', 'best total spiking % with 110+ attempts', 
            'best total spiking % with 120+ attempts', 'best total spiking % with 130+ attempts', 'best total spiking % with 140+ attempts', 
            'best total spiking % with 150+ attempts', 'best total spiking % with 160+ attempts', 'best total spiking % with 170+ attempts', 
            'best total spiking % with 180+ attempts', 'best total spiking % with 190+ attempts', 'best total spiking % with 200+ attempts', 
            'best total spiking % with 210+ attempts', 'best total spiking % with 220+ attempts', 'best total spiking % with 230+ attempts', 
            'best total spiking % with 240+ attempts', 'best total spiking % with 250+ attempts'
            ]
    })
    record!: string;

    @Column({
        type: 'enum',
        enum: ['game', 'season'],
        default: 'game'
    })
    type!: string; // 'game' for single game records, 'season' for season aggregate records

    @Column({ type: 'int' })
    rank!: number; // Position in top 10 (1-10)

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    value!: number; // The actual record value (e.g., 25 kills, 85.5% spike percentage)

    @Column({ type: 'date' })
    date!: Date; // Date when the record was achieved (date of the game)

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    // Many-to-one relationship with seasons
    @ManyToOne('Seasons', 'records')
    season!: Seasons;

    // Many-to-one relationship with players
    @ManyToOne('Players', 'records')
    player!: Players;

    // Game ID (optional, only for game records)
    @Column({ type: 'int', nullable: true })
    gameId!: number;




}