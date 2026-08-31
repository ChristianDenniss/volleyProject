import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from "typeorm";
import type { Games } from "./game.entity.js";
import type { User } from "../user/user.entity.js";

export enum GameStaffRole {
    REFEREE = "referee",
    STREAMER = "streamer",
    COMMENTATOR = "commentator",
}

export const GAME_STAFF_ROLES = [
    GameStaffRole.REFEREE,
    GameStaffRole.STREAMER,
    GameStaffRole.COMMENTATOR,
] as const;

@Entity("game_staff")
@Unique("UQ_game_staff_game_user_role", ["gameId", "userId", "role"])
@Index("IDX_game_staff_userId", ["userId"])
@Index("IDX_game_staff_gameId", ["gameId"])
export class GameStaff {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    gameId!: number;

    @ManyToOne("Games", "staff", { onDelete: "CASCADE" })
    @JoinColumn({ name: "gameId" })
    game!: Games;

    @Column()
    userId!: number;

    @ManyToOne("User", { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user!: User;

    @Column({ type: "varchar" })
    role!: GameStaffRole;
}

export type GameStaffInput = {
    userId: number;
    role: GameStaffRole;
};
