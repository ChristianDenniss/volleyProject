import { CustomError } from "./CustomError.js";

export class DuplicateError extends CustomError {
    constructor(message: string) {
        super(message, 409);
    }
}