import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

export type ApplicationFormStatus = "open" | "closed";
export type ApplicationFormCategory =
    | "staff"
    | "media"
    | "game-officials"
    | "management";

@Entity()
export class ApplicationForm {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    slug!: string;

    @Column()
    name!: string;

    @Column()
    type!: string;

    @Column({ type: "text" })
    description!: string;

    @Column({ type: "varchar", nullable: true })
    url!: string | null;

    @Column({ type: "varchar", default: "closed" })
    status!: ApplicationFormStatus;

    @Column()
    category!: ApplicationFormCategory;

    @Column({ default: 0 })
    sortOrder!: number;

    @CreateDateColumn({ type: "timestamp" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt!: Date;
}
