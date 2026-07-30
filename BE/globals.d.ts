import type { VerifiedJwtUser } from "./src/middleware/authValidation.js";

declare global {
  namespace Express {
    interface Request {
      user?: VerifiedJwtUser;
    }
  }
}

export {};
