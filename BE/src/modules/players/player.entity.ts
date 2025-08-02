import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import type { Teams } from '../teams/team.entity.js';
import type { Stats } from '../stats/stat.entity.js';
import type { Awards } from '../awards/award.entity.js';
import type { Records } from '../records/records.entity.js';

@Entity()
export class Players {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ default: "N/A" })
    position!: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    // Many-to-many relationship with Teams
    @ManyToMany('Teams', 'players')
    @JoinTable() // This creates a join table to store the relationship
    teams!: Teams[];  // A player can belong to many teams

    // One-to-many relationship with stats, a player can have many stats entries
    @OneToMany('Stats', 'player')
    stats!: Stats[];

    // Many-to-many relationship with Awards
    @ManyToMany('Awards', 'players')
    awards!: Awards[];  

    // One-to-many relationship with records, a player can have many records
    @OneToMany('Records', 'player')
    records!: Records[];
}