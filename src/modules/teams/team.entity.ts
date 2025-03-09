import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, ManyToMany } from 'typeorm';
import { Seasons } from '../seasons/season.entity';
import { Players } from '../players/player.entity';
import { Games } from '../games/game.entity';

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