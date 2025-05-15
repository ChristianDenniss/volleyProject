import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import type { User } from "../user/user.entity.js";

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

    //come back and fix this making it relational later on
    @Column({ default: 0 })
    likes!: number;

    // Also use string reference here
    @ManyToOne('User', 'articles', { nullable: false })
    author!: User;
}
