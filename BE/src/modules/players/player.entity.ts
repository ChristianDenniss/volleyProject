import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable, Index, ManyToOne, JoinColumn } from 'typeorm';
import type { Teams } from '../teams/team.entity.js';
import type { Stats } from '../stats/stat.entity.js';
import type { Awards } from '../awards/award.entity.js';
import type { Records } from '../records/records.entity.js';
import type { User } from '../user/user.entity.js';

@Entity()
@Index('IDX_players_name', ['name'])
@Index('IDX_players_robloxUsername', ['robloxUsername'])
export class Players {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ default: "N/A" })
    position!: string;

    @Column({ type: 'varchar', nullable: true })
    robloxUsername!: string | null;

    @Column({ type: 'varchar', nullable: true })
    robloxUserId!: string | null;

    @Column({ type: 'varchar', nullable: true })
    discordUsername!: string | null;

    @Column({ type: 'int', nullable: true })
    userId!: number | null;

    @ManyToOne('User', { nullable: true })
    @JoinColumn({ name: 'userId' })
    user!: User | null;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    @ManyToMany('Teams', 'players')
    @JoinTable()
    teams!: Teams[];

    @OneToMany('Stats', 'player')
    stats!: Stats[];

    @ManyToMany('Awards', 'players')
    awards!: Awards[];  

    @OneToMany('Records', 'player')
    records!: Records[];
}
