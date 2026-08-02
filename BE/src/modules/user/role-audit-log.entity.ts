import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from "typeorm";

@Entity("role_audit_log")
@Index("IDX_role_audit_log_targetId", ["targetId"])
@Index("IDX_role_audit_log_actorId", ["actorId"])
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
