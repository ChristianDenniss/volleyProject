import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";
import { getJwtSecret, validateJwtPayload, VerifiedJwtUser } from "./authValidation.js";
import { extractAuthToken } from "./authCookie.js";

export type JwtPayload = VerifiedJwtUser;

export const authenticateCombined = (req: Request, res: Response, next: NextFunction): void =>
{
    void (async () =>
    {
        try
        {
            const token = extractAuthToken(req);

            if (!token)
            {
                throw new UnauthorizedError("Authorization token is required");
            }

            const decoded = jwt.verify(token, getJwtSecret());

            if (!decoded || typeof decoded !== "object")
            {
                throw new UnauthorizedError("Invalid or expired token");
            }

            (req as any).user = await validateJwtPayload(decoded as jwt.JwtPayload);
            next();
        }
        catch (err)
        {
            next(err instanceof UnauthorizedError ? err : new UnauthorizedError("Invalid or expired token"));
        }
    })();
};
