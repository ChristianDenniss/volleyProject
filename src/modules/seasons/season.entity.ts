import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Teams } from '../teams/team.entity';
import { Games } from '../games/game.entity';

@Entity()
export class Seasons {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    year!: number;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    // One-to-many relationship with teams, a season can have many teams
    @OneToMany(() => Teams, (team) => team.season)
    teams!: Teams[];

    // One-to-many relationship with games, a season can have many games
    @OneToMany(() => Games, (game) => game.season)
    games!: Games[];
}