import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import type { Games } from '../games/game.entity.js';
import type { Teams } from '../teams/team.entity.js';
import type { Awards } from '../awards/award.entity.js';
import type { Records } from '../records/records.entity.js';
import type { Region } from '../regions/region.entity.js';

@Entity()
export class Seasons {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    seasonNumber!: number;

    @Column()
    startDate!: Date;

    @Column({ nullable: true })
    endDate!: Date;

    @Column({ nullable: true })
    image!: string;

    @Column({ nullable: true })
    theme!: string;

    @Column()
    regionId!: number;

    @ManyToOne('Region')
    @JoinColumn({ name: 'regionId' })
    region!: Region;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    @OneToMany('Games', 'season')
    games!: Games[];

    @OneToMany('Teams', 'season')
    teams!: Teams[];

    @OneToMany('Awards', 'season')
    awards!: Awards[];

    @OneToMany('Records', 'season')
    records!: Records[];
}
