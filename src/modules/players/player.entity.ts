import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
// I think this may be a circular depend issue occuring
import { Teams } from '../teams/team.entity.js';
import { Stats } from '../stats/stat.entity.js';

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

    // Direct circular reference with Teams
    @ManyToOne(() => Teams, (team) => team.players)
    team!: Teams;

    // One-to-many relationship with stats, a player can have many stats entries
    @OneToMany(() => Stats, (stat) => stat.player)
    stats!: Stats[];
}
