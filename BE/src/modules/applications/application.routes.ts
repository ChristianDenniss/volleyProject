import { Application as ExpressApp, Router } from "express";
import { authenticateCombined } from "../../middleware/combinedAuth.js";
import { authorizeRoles } from "../../middleware/authorizeRoles.js";
import { validate } from "../../middleware/validate.js";
import { ApplicationController } from "./application.controller.js";
import { updateApplicationSchema } from "./application.schema.js";

export function registerApplicationRoutes(app: ExpressApp): void {
    const router = Router();
    const controller = new ApplicationController();

    router.get("/", controller.getAll);
    router.patch(
        "/:slug",
        authenticateCombined,
        authorizeRoles("admin", "superadmin"),
        validate(updateApplicationSchema),
        controller.updateBySlug
    );

    app.use("/api/applications", router);
}
