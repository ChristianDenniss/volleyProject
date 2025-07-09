//  src/middleware/authenticateToken.ts
//  — Verifies a Bearer JWT
//  — On success attaches the full user payload (id, role, etc.) to req.user
//  — Throws UnauthorizedError on any failure

import { Request, Response, NextFunction } from "express";
import jwt                                from "jsonwebtoken";
import { UnauthorizedError }              from "../errors/UnauthorizedError.ts";

//  You can create a narrow interface if you like, without touching global types
export interface JwtPayload
{
    id:   number;
    role: string;          //  "user" | "admin" | "superadmin"
    username: string;
}

const getSignSecret = () => process.env.JWT_SECRET || ""

export const cookieKey = "authorization"
export const newJWT = (payload: JwtPayload) => {
    return jwt.sign(payload, getSignSecret())
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void =>
{
    //  Pull the Bearer token from the Authorization header
    let token: string | undefined = req.cookies[cookieKey]
    if (typeof token !== "string") {
        token = req.header("Authorization")?.replace("Bearer ", "");
    } else {
        console.log("got from cookies")
    }

    console.log('cookies', req.cookies)

    //  Fail early if missing
    if (!token)
    {
        throw new UnauthorizedError("Authorization token is required");
    }

    //  Verify the token
    jwt.verify(token, getSignSecret(), (err, decoded) =>
    {
        //  Any error → unauth
        if (err)
        {
            throw new UnauthorizedError("Invalid or expired token");
        }

        //  decoded is *unknown*; validate it has the pieces we need
        if
        (
            decoded &&
            typeof decoded === "object" &&
            "id"   in decoded &&
            "role" in decoded
        )
        {
            //  Attach the user object for downstream middleware / controllers
            //  We avoid declare global by casting here
            (req as any).user = decoded as JwtPayload;
        }
        else
        {
            //  Malformed payload
            throw new UnauthorizedError("Token payload missing required fields");
        }

        //  Proceed to the next middleware / route
        next();
    });
};
