import { CustomError } from "./CustomError";

export class DuplicateError extends CustomError {
    constructor(message: string) {
        super(message, 409);
    }
}