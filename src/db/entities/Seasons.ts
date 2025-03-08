import {Entity, PrimaryGeneratedColumn, Column, Unique, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { Teams } from './Teams';

@Entity()
@Unique(["seasonNumber"]) // Ensures no duplicate season numbers

export class Seasons
{
    // I'm using the ! because TS is on strict mode and it doesnt like that the variable isnt intialized
    // The ! is promising it will get initialized later on
    @PrimaryGeneratedColumn()
    id!: number;

    @Column() // the season number, we need this to be unique
    seasonNumber!: number;

    @Column()
    startDate!: Date;

    @Column()
    endDate!: Date;

    @Column()
    isActive!: boolean; // whether season is the current one or not

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;
    
    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    //One season to many teams!
    @OneToMany(() => Teams, (team) => team.season)  
    teams!: Teams[];
    
}