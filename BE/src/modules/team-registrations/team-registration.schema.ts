import { z } from "zod";
import { REGION_CODES } from "../regions/region.entity.js";

const rosterEntrySchema = z.object({
    discord: z.string().min(1),
    roblox: z.string().min(1),
});

const teamRegistrationFields = z.object({
    region: z.enum(REGION_CODES),
    teamName: z.string().min(1).max(64),
    hexColor: z.string().regex(/^#([0-9A-Fa-f]{6})$/, { message: "hexColor must be #RRGGBB" }),
    brickColor: z.string().min(1).max(64),
    captainDiscord: z.string().min(1),
    captainRoblox: z.string().min(1),
    viceDiscord: z.string().min(1),
    viceRoblox: z.string().min(1),
    roster: z.array(rosterEntrySchema).min(10),
    agreeCivilScheduling: z.literal(true),
    confidentWillParticipate: z.literal(true),
    priorLeagueExperience: z.string().max(2000).optional().nullable(),
    logoJerseyAck: z.literal(true),
});

function refineTeamRegistrationRoster(
    data: {
        roster: Array<{ roblox: string }>;
        captainRoblox: string;
        viceRoblox: string;
    },
    ctx: z.RefinementCtx
): void {
    const robloxes = data.roster.map((r) => r.roblox.trim().toLowerCase());
    const unique = new Set(robloxes);
    if (unique.size !== robloxes.length) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duplicate Roblox usernames in roster", path: ["roster"] });
    }
    const captain = data.captainRoblox.trim().toLowerCase();
    const vice = data.viceRoblox.trim().toLowerCase();
    if (!robloxes.includes(captain)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Roster must include captain Roblox", path: ["roster"] });
    }
    if (!robloxes.includes(vice)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Roster must include vice Roblox", path: ["roster"] });
    }
}

export const createTeamRegistrationSchema = teamRegistrationFields.superRefine(refineTeamRegistrationRoster);

export const updateTeamRegistrationSchema = teamRegistrationFields
    .partial()
    .omit({ region: true })
    .superRefine((data, ctx) => {
        // Only enforce roster inclusion rules when enough fields are present to check.
        if (!data.roster || !data.captainRoblox || !data.viceRoblox) return;
        refineTeamRegistrationRoster(
            {
                roster: data.roster,
                captainRoblox: data.captainRoblox,
                viceRoblox: data.viceRoblox,
            },
            ctx
        );
    });


export const resolveRegistrationSchema = z.object({
    decision: z.enum(["pending", "denied"]).optional(),
    teamName: z.string().min(1).max(64).optional(),
    players: z
        .array(
            z.object({
                roblox: z.string().min(1),
                action: z.enum(["transfer", "exclude"]),
            })
        )
        .optional(),
});

export type CreateTeamRegistrationDto = z.infer<typeof createTeamRegistrationSchema>;
export type UpdateTeamRegistrationDto = z.infer<typeof updateTeamRegistrationSchema>;
export type ResolveRegistrationDto = z.infer<typeof resolveRegistrationSchema>;

export const staffTeamUpdateSchema = z.object({
    name: z.string().min(1).max(64).optional(),
    hexColor: z.string().regex(/^#([0-9A-Fa-f]{6})$/).optional().nullable(),
    brickColor: z.string().min(1).max(64).optional().nullable(),
    logoUrl: z.string().url().optional().nullable(),
    roster: z.array(rosterEntrySchema).min(10).optional(),
    captainUserId: z.number().int().positive().optional().nullable(),
    viceCaptainUserId: z.number().int().positive().optional().nullable(),
    courtCaptainUserId: z.number().int().positive().optional().nullable(),
});

export const adminTeamFlagsSchema = z.object({
    captainEditEnabled: z.boolean().optional(),
    hexColor: z.string().regex(/^#([0-9A-Fa-f]{6})$/).optional().nullable(),
    brickColor: z.string().min(1).max(64).optional().nullable(),
    captainUserId: z.number().int().positive().optional().nullable(),
    viceCaptainUserId: z.number().int().positive().optional().nullable(),
    courtCaptainUserId: z.number().int().positive().optional().nullable(),
});
