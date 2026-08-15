export class ServiceError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_FOUND" | "CONFLICT" | "BAD_REQUEST",
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends ServiceError {
  constructor(what: string) {
    super(`${what} not found`, "NOT_FOUND");
  }
}

export class ConflictError extends ServiceError {
  constructor(message: string) {
    super(message, "CONFLICT");
  }
}

export class BadRequestError extends ServiceError {
  constructor(message: string) {
    super(message, "BAD_REQUEST");
  }
}

export function required<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined || value === "") {
    throw new BadRequestError(`${what} is required`);
  }
  return value;
}

export function found<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) throw new NotFoundError(what);
  return value;
}
