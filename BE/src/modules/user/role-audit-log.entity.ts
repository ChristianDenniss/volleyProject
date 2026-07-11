import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class RoleAuditLog {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    actorId!: number;

    @Column()
    targetId!: number;

    @Column()
    oldRole!: string;

    @Column()
    newRole!: string;

    @Column({ type: "varchar", nullable: true })
    ip!: string | null;

    @CreateDateColumn({ type: "timestamp" })
    createdAt!: Date;
}
