/**
 * Historical alias: authenticateCombined was a duplicate of authenticateToken.
 * Re-export so existing route imports keep working from one implementation.
 */
export { authenticateToken as authenticateCombined, type JwtPayload } from "./authentication.js";
