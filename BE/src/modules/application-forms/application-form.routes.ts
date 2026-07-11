import { Application, Router } from "express";
import { authenticateCombined } from "../../middleware/combinedAuth.js";
import { authorizeRoles } from "../../middleware/authorizeRoles.js";
import { validate } from "../../middleware/validate.js";
import { ApplicationFormController } from "./application-form.controller.js";
import { updateApplicationFormSchema } from "./application-form.schema.js";

export function registerApplicationFormRoutes(app: Application): void {
    const router = Router();
    const controller = new ApplicationFormController();

    router.get("/", controller.getAll);
    router.patch(
        "/:slug",
        authenticateCombined,
        authorizeRoles("admin", "superadmin"),
        validate(updateApplicationFormSchema),
        controller.updateBySlug
    );

    app.use("/api/application-forms", router);
}
