import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, ManyToOne, JoinColumn } from 'typeorm';
import { Players } from '../players/player.entity.js';
import { Seasons } from '../seasons/season.entity.js';

@Entity()
export class Awards {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    description!: string;

    @Column({
        type: 'enum',
        enum: ["MVP", "Best Spiker", "Best Server", "Best Blocker", "Best Libero", "Best Setter", "MIP", "Best Aper", "FMVP", "DPOS", "Best Receiver", "LuvLate Award"],
        default: "MVP"
    })
    type!: string;

    @Column({ nullable: true })
    imageUrl?: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    // Many-to-many relationship with Players
    @ManyToMany(() => Players, (player) => player.awards)
    @JoinTable() // This creates a join table to store the relationship
    players!: Players[];  // An award can be given to many players

    // Many-to-one relationship with Seasons
    @ManyToOne(() => Seasons, (season) => season.awards)
    @JoinColumn()
    season!: Seasons;  // An award belongs to one season
} 