import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, ManyToOne, JoinColumn } from 'typeorm';
import { Players } from '../players/player.entity.js';
import { Seasons } from '../seasons/season.entity.js';
import type { Region } from '../regions/region.entity.js';

@Entity()
export class Awards {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    description!: string;

    @Column({
        type: 'enum',
        enum: ["MVP", "Best Spiker", "Best Server", "Best Blocker", "Best Libero", "Best Setter", "MIP", "Best Aper", "FMVP", "DPOS", "Best Receiver", "LuvLate Award"],
        default: "MVP"
    })
    type!: string;

    @Column({ nullable: true })
    imageUrl?: string;

    @Column()
    seasonId!: number;

    @Column()
    regionId!: number;

    @ManyToOne('Region')
    @JoinColumn({ name: 'regionId' })
    region!: Region;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    @ManyToMany(() => Players, (player) => player.awards)
    @JoinTable({ name: 'awards_players_players' })
    players!: Players[];

    @ManyToOne(() => Seasons, (season) => season.awards)
    @JoinColumn()
    season!: Seasons;
}
