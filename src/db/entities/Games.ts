import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, OneToMany, JoinTable } from 'typeorm';
import { Stats } from './Stats';
import { Teams } from './Teams';

@Entity()
export class Games
{
    @PrimaryGeneratedColumn()
    id!: number;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;
    
    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    @OneToMany(() => Stats, (stats) => stats.game)
    stats!: Stats[];

    // Many-to-many relationship with teams; each game involving two teams
    @ManyToMany(() => Teams, (team) => team.games)
    @JoinTable()  
    teams!: Teams[];  // The teams that played in the game
}
