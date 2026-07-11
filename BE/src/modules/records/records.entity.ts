import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import type { Seasons } from '../seasons/season.entity.js';
import type { Players } from '../players/player.entity.js';
import type { Region } from '../regions/region.entity.js';

@Entity()
export class Records {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: 'enum',
        enum: [
            'most spike kills', 'most assists', 'most ape kills', 'most digs', 'most block follows', 'most blocks', 'most aces', 'most serve errors',
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
        default: "game"
    })
    type!: string;

    @Column({ type: 'int' })
    rank!: number;

    @Column('decimal', { precision: 10, scale: 2 })
    value!: number;

    @Column('date')
    date!: Date;

    @Column()
    seasonId!: number;

    @Column()
    playerId!: number;

    @Column()
    regionId!: number;

    @ManyToOne('Region')
    @JoinColumn({ name: 'regionId' })
    region!: Region;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    @ManyToOne('Players', 'records')
    @JoinColumn()
    player!: Players;

    @ManyToOne('Seasons', 'records')
    @JoinColumn()
    season!: Seasons;

    @Column({ type: 'int', nullable: true })
    gameId!: number;
}
