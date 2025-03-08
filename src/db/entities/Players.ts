import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany} from "typeorm";
import { Teams } from './Teams';
import { Stats } from './Stats';

@Entity()

export class Players
{
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    position!: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;
    
    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    @OneToMany(() => Stats, (stat) => stat.player)
    stats!: Stats[];

    // Many-to-one relationship: Each player belongs to one team
    @ManyToOne(() => Teams, (team) => team.players)  
    team!: Teams;  // The team a player belongs to
}