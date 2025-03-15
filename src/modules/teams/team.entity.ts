import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, ManyToMany } from 'typeorm';
import { Seasons } from '../seasons/season.entity.js';
import { Players } from '../players/player.entity.js';
import { Games } from '../games/game.entity.js';

@Entity()
export class Teams {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    // Many-to-one relationship with seasons, each team can have only 1 season
    @ManyToOne(() => Seasons, (season) => season.teams)  
    season!: Seasons;  //column with the season the team was in

    //A team can have many players, player 1 team
    @OneToMany(() => Players, (player) => player.team) 
    players!: Players[];  // List of players in the team

    @ManyToMany(() => Games, (game) => game.teams)
    games!: Games[];
}