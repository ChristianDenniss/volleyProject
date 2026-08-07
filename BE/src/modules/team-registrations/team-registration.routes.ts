import { Application, Router } from "express";
import { validate } from "../../middleware/validate.js";
import { authenticateToken } from "../../middleware/authentication.js";
import { authorizeRoles } from "../../middleware/authorizeRoles.js";
import { TeamRegistrationController } from "./team-registration.controller.js";
import {
    createTeamRegistrationSchema,
    updateTeamRegistrationSchema,
    resolveRegistrationSchema,
} from "./team-registration.schema.js";

/** Optional auth — attaches user if token present, never 401s. */
function optionalAuth(req: any, res: any, next: any): void {
    const header = req.header?.("Authorization") || "";
    const hasCookie = Boolean(req.cookies?.auth_token);
    if (!header && !hasCookie) {
        next();
        return;
    }
    authenticateToken(req, res, (err?: unknown) => {
        if (err) {
            // ignore invalid token for public list enrichment
            next();
            return;
        }
        next();
    });
}

export function registerTeamRegistrationRoutes(app: Application): void {
    const router = Router();
    const controller = new TeamRegistrationController();

    router.get("/", optionalAuth, controller.list);
    router.get("/summary", controller.summary);
    router.get("/:id", optionalAuth, controller.getOne);

    router.post("/", authenticateToken, validate(createTeamRegistrationSchema), controller.submit);
    router.patch("/:id", authenticateToken, validate(updateTeamRegistrationSchema), controller.update);
    router.delete("/:id", authenticateToken, controller.withdraw);

    router.post(
        "/:id/accept",
        authenticateToken,
        authorizeRoles("admin", "superadmin"),
        controller.accept
    );
    router.post(
        "/:id/resolve",
        authenticateToken,
        authorizeRoles("admin", "superadmin"),
        validate(resolveRegistrationSchema),
        controller.resolve
    );
    router.post(
        "/:id/deny",
        authenticateToken,
        authorizeRoles("admin", "superadmin"),
        controller.deny
    );
    router.post(
        "/:id/revoke",
        authenticateToken,
        authorizeRoles("admin", "superadmin"),
        controller.revoke
    );

    app.use("/api/team-registrations", router);
}
