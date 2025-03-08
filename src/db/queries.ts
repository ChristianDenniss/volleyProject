import { AppDataSource } from "./data-source";
import { User } from "./entities/User";

const userRepository = AppDataSource.getRepository(User);

export const getUsers = async () =>
{
    return await userRepository.find(); // Fetches all users
};
