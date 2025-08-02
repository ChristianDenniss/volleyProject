import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Players } from '../players/player.entity.js';

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

    @Column()
    seasonId!: number; // Foreign key to seasons table

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    // Many-to-many relationship with Players
    @ManyToMany(() => Players, (player) => player.awards)
    @JoinTable({ name: 'awards_players_players' }) // Explicitly set the join table name
    players!: Players[];  // An award can be given to many players
} 