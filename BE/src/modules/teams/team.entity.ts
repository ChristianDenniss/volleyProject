import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, JoinTable, JoinColumn, Index } from 'typeorm';
import type { Seasons } from '../seasons/season.entity.js';
import type { Players } from '../players/player.entity.js';
import type { Games } from '../games/game.entity.js';
import type { Region } from '../regions/region.entity.js';

@Entity()
@Index('IDX_teams_regionId', ['regionId'])
@Index('IDX_teams_seasonId', ['season'])
@Index('IDX_teams_name', ['name'])
export class Teams 
{
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ nullable: true, default: null })
    logoUrl?: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    @Column({default: "Didnt make playoffs"})
    placement!: string;

    @Column()
    regionId!: number;

    @ManyToOne('Region')
    @JoinColumn({ name: 'regionId' })
    region!: Region;

    @ManyToOne('Seasons', 'teams')
    season!: Seasons;

    @ManyToMany('Players', 'teams')
    @JoinTable({
        name: 'teams_players',
    })
    players!: Players[];

    @ManyToMany('Games', 'teams')
    @JoinTable({
        name: 'teams_games',
    })
    games!: Games[];
}
