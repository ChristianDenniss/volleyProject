import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

export type ApplicationStatus = "open" | "closed";
export type ApplicationCategory =
    | "staff"
    | "media"
    | "game-officials"
    | "management";

@Entity()
export class Application {
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
    status!: ApplicationStatus;

    @Column()
    category!: ApplicationCategory;

    @Column({ default: 0 })
    sortOrder!: number;

    @CreateDateColumn({ type: "timestamp" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt!: Date;
}
