import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { User } from "../user/user.entity.ts";

@Entity()
export class Article
{
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @Column({ type: "text" })
    summary!: string;

    @Column({ type: "text" })
    content!: string;

    @Column()
    imageUrl!: string;

    @CreateDateColumn({ type: "timestamp" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt!: Date;

    @Column({ type: "boolean", nullable: true, default: null })
    approved!: boolean | null;

    //come back and fix this making it relational later on
    @Column({ default: 0 })
    likes!: number;

    @ManyToOne(() => User, user => user.articles, { nullable: false })
    author!: User;
}
