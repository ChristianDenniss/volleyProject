import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Teams } from '../teams/team.entity';
import { Stats } from '../stats/stat.entity';

@Entity()
export class Players {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    jerseyNumber!: number;

    @Column()
    position!: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    // Many-to-one relationship with teams, each player can have only 1 team
    @ManyToOne(() => Teams, (team) => team.players)  
    team!: Teams;

    // One-to-many relationship with stats, a player can have many stats entries
    @OneToMany(() => Stats, (stat) => stat.player)
    stats!: Stats[];
}