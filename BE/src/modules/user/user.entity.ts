import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import type { Article } from "../articles/article.entity.js";

@Entity()
export class User
{
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    username!: string;

    @Column()
    email!: string;

    @Column()
    password!: string;

    @Column({ default: 'user' })
    role!: string;

    @Column({ default: 0 })
    tokenVersion!: number;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    // No circular issue here — we use the string reference!
    @OneToMany('Article', 'author')
    articles!: Article[];
}
