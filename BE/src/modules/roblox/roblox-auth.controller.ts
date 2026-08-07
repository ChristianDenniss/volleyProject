import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { UserService } from "../user/user.service.js";
import { setAuthCookies } from "../../middleware/authCookie.js";
import { ConflictError } from "../../errors/ConflictError.js";
import { UnauthorizedError } from "../../errors/UnauthorizedError.js";
import { getJwtSecret } from "../../middleware/authValidation.js";

export type RobloxOAuthIntent = "connect" | "signup" | "login";

const AUTHORIZE_URL = "https://apis.roblox.com/oauth/v1/authorize";
const TOKEN_URL = "https://apis.roblox.com/oauth/v1/token";
const USERINFO_URL = "https://apis.roblox.com/oauth/v1/userinfo";
const STATE_COOKIE = "roblox_oauth_state";
const STATE_TTL_MS = 10 * 60 * 1000;

interface OAuthStatePayload {
    intent: RobloxOAuthIntent;
    userId?: number;
    nonce: string;
    exp: number;
}

function getFrontendUrl(): string {
    return process.env.FRONTEND_URL || process.env.CORS_ORIGINS?.split(",")[0]?.trim() || "http://localhost:5173";
}

function getRobloxConfig(): { clientId: string; clientSecret: string; redirectUri: string } | null {
    const clientId = process.env.ROBLOX_OAUTH_CLIENT_ID?.trim();
    const clientSecret = process.env.ROBLOX_OAUTH_CLIENT_SECRET?.trim();
    const redirectUri =
        process.env.ROBLOX_OAUTH_REDIRECT_URI?.trim() ||
        `${process.env.BACKEND_PUBLIC_URL || "http://localhost:3000"}/api/auth/roblox/callback`;

    if (!clientId || !clientSecret) {
        return null;
    }

    return { clientId, clientSecret, redirectUri };
}

function signState(payload: OAuthStatePayload): string {
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const sig = crypto.createHmac("sha256", getJwtSecret()).update(body).digest("base64url");
    return `${body}.${sig}`;
}

function verifyState(state: string): OAuthStatePayload {
    const [body, sig] = state.split(".");
    if (!body || !sig) throw new UnauthorizedError("Invalid OAuth state");
    const expected = crypto.createHmac("sha256", getJwtSecret()).update(body).digest("base64url");
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
        throw new UnauthorizedError("Invalid OAuth state signature");
    }
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as OAuthStatePayload;
    if (payload.exp < Date.now()) throw new UnauthorizedError("OAuth state expired");
    return payload;
}

export class RobloxAuthController {
    private userService = new UserService();

    start = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const intent = (req.query.intent as RobloxOAuthIntent) || "login";
            if (!["connect", "signup", "login"].includes(intent)) {
                res.status(400).json({ error: "intent must be connect, signup, or login" });
                return;
            }

            if (intent === "connect" && !req.user?.id) {
                res.status(401).json({ error: "Must be logged in to connect Roblox" });
                return;
            }

            const config = getRobloxConfig();
            if (!config) {
                res.status(503).json({
                    error:
                        "Roblox OAuth is not configured. Set ROBLOX_OAUTH_CLIENT_ID and ROBLOX_OAUTH_CLIENT_SECRET (and register redirect URI http://localhost:3000/api/auth/roblox/callback).",
                });
                return;
            }
            const { clientId, redirectUri } = config;
            const payload: OAuthStatePayload = {
                intent,
                userId: intent === "connect" ? req.user!.id : undefined,
                nonce: crypto.randomBytes(16).toString("hex"),
                exp: Date.now() + STATE_TTL_MS,
            };
            const state = signState(payload);

            res.cookie(STATE_COOKIE, state, {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                maxAge: STATE_TTL_MS,
                path: "/",
            });

            const url = new URL(AUTHORIZE_URL);
            url.searchParams.set("client_id", clientId);
            url.searchParams.set("redirect_uri", redirectUri);
            url.searchParams.set("scope", "openid profile");
            url.searchParams.set("response_type", "code");
            url.searchParams.set("state", state);

            res.json({ url: url.toString() });
        } catch (error) {
            next(error);
        }
    };

    callback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const frontend = getFrontendUrl();
        try {
            const code = typeof req.query.code === "string" ? req.query.code : null;
            const state = typeof req.query.state === "string" ? req.query.state : req.cookies?.[STATE_COOKIE];
            const oauthError = typeof req.query.error === "string" ? req.query.error : null;

            if (oauthError) {
                res.redirect(`${frontend}/login?roblox=error&message=${encodeURIComponent(oauthError)}`);
                return;
            }
            if (!code || !state) {
                res.redirect(`${frontend}/login?roblox=error&message=${encodeURIComponent("Missing code or state")}`);
                return;
            }

            const payload = verifyState(state);
            const config = getRobloxConfig();
            if (!config) {
                res.redirect(
                    `${frontend}/login?roblox=error&message=${encodeURIComponent("Roblox OAuth is not configured")}`
                );
                return;
            }
            const { clientId, clientSecret, redirectUri } = config;

            const tokenRes = await fetch(TOKEN_URL, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    grant_type: "authorization_code",
                    code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: redirectUri,
                }),
            });

            if (!tokenRes.ok) {
                const text = await tokenRes.text();
                console.error("Roblox token exchange failed", text);
                res.redirect(`${frontend}/login?roblox=error&message=${encodeURIComponent("Token exchange failed")}`);
                return;
            }

            const tokenJson = (await tokenRes.json()) as { access_token: string };
            const infoRes = await fetch(USERINFO_URL, {
                headers: { Authorization: `Bearer ${tokenJson.access_token}` },
            });
            if (!infoRes.ok) {
                res.redirect(`${frontend}/login?roblox=error&message=${encodeURIComponent("Failed to fetch Roblox profile")}`);
                return;
            }

            const info = (await infoRes.json()) as {
                sub?: string;
                preferred_username?: string;
                nickname?: string;
                name?: string;
            };

            const robloxUserId = String(info.sub || "");
            const robloxUsername = info.preferred_username || info.nickname || info.name || "";
            if (!robloxUserId || !robloxUsername) {
                res.redirect(`${frontend}/login?roblox=error&message=${encodeURIComponent("Incomplete Roblox profile")}`);
                return;
            }

            res.clearCookie(STATE_COOKIE, { path: "/" });

            if (payload.intent === "connect") {
                if (!payload.userId) {
                    res.redirect(`${frontend}/profile?roblox=error&message=${encodeURIComponent("Not logged in")}`);
                    return;
                }
                await this.userService.connectRoblox(payload.userId, robloxUserId, robloxUsername);
                const { user, token } = await this.userService.issueTokenForUser(payload.userId);
                setAuthCookies(res, token);
                res.redirect(`${frontend}/profile?roblox=connected&user=${encodeURIComponent(user.robloxUsername || robloxUsername)}`);
                return;
            }

            if (payload.intent === "login") {
                const existing = await this.userService.findByRobloxUserId(robloxUserId);
                if (!existing) {
                    res.redirect(`${frontend}/signup?roblox=need_signup`);
                    return;
                }
                const { token } = await this.userService.issueTokenForUser(existing.id);
                setAuthCookies(res, token);
                res.redirect(`${frontend}/?roblox=login`);
                return;
            }

            // signup
            const existing = await this.userService.findByRobloxUserId(robloxUserId);
            if (existing) {
                const { token } = await this.userService.issueTokenForUser(existing.id);
                setAuthCookies(res, token);
                res.redirect(`${frontend}/?roblox=login`);
                return;
            }

            const { token } = await this.userService.createUserFromRoblox(robloxUserId, robloxUsername);
            setAuthCookies(res, token);
            res.redirect(`${frontend}/?roblox=signup`);
        } catch (error) {
            if (error instanceof ConflictError) {
                res.redirect(`${frontend}/profile?roblox=error&message=${encodeURIComponent(error.message)}`);
                return;
            }
            next(error);
        }
    };

    unlink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user?.id) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }
            const user = await this.userService.unlinkRoblox(req.user.id);
            res.json(this.userService.toPublicUser(user));
        } catch (error) {
            next(error);
        }
    };

    adminUnlink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const targetId = Number(req.params.id);
            const user = await this.userService.unlinkRoblox(targetId);
            res.json(this.userService.toPublicUser(user));
        } catch (error) {
            next(error);
        }
    };
}
