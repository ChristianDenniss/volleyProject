import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class User
{
    @PrimaryGeneratedColumn()
    id: number = 0;  // default value

    @Column()
    name: string = '';  // default value

    @Column()
    email: string = '';  // default value
}