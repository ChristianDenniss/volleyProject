import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm';
// I think this may be a circular depend issue occuring
import { Teams } from '../teams/team.entity.ts';
import { Stats } from '../stats/stat.entity.ts';
import { Awards } from '../awards/award.entity.ts';

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
    @ManyToMany(() => Teams, (team) => team.players)
    @JoinTable() // This creates a join table to store the relationship
    teams!: Teams[];  // A player can belong to many teams

    // One-to-many relationship with stats, a player can have many stats entries
    @OneToMany(() => Stats, (stat) => stat.player)
    stats!: Stats[];

    // Many-to-many relationship with Awards
    @ManyToMany(() => Awards, (award) => award.players)
    awards!: Awards[];  
}