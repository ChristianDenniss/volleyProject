import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import type { Teams } from '../teams/team.entity.ts';
import type { Games } from '../games/game.entity.ts';
import { Awards } from '../awards/award.entity.ts';

@Entity()
export class Seasons {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    seasonNumber!: number;

    @Column({default: "None"})
    theme!: string;

    @Column( {nullable: true})
    image?: string;

    @Column()
    startDate!: Date;

    @Column()
    endDate!: Date;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    // One-to-many relationship with teams, a season can have many teams
    @OneToMany('Teams', 'season')
    teams!: Teams[];

    // One-to-many relationship with games, a season can have many games
    @OneToMany('Games', 'season')
    games!: Games[];

    // One-to-many relationship with Awards
    @OneToMany(() => Awards, (award) => award.season)
    awards!: Awards[];  // A season can have many awards
}