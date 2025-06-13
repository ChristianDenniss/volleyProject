import { AppDataSource } from "./data-source.ts";
import { User } from "../modules/user/user.entity.ts";

/**
 * Repository examples - use module services instead of direct queries in the application
 * This file can be used for complex custom queries that don't fit into the service pattern
 */

export const userRepository = AppDataSource.getRepository(User);

export const getUsers = async () => {
    return await userRepository.find();
};

export const getUserById = async (id: number) => {
    return await userRepository.findOneBy({ userId: id });
};