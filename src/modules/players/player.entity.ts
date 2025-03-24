import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import type { Teams } from '../teams/team.entity.js';
import type { Stats } from '../stats/stat.entity.js';

@Entity()
export class Players {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    position!: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    // Fix circular reference with Teams using string literal
    @ManyToOne('Teams', 'players')
    team!: Teams;

    // One-to-many relationship with stats, a player can have many stats entries
    @OneToMany('Stats', 'player')
    stats!: Stats[];
}