import { AppDataSource } from "../../db/data-source.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import {
    ApplicationForm,
    ApplicationFormStatus,
} from "./application-form.entity.js";

const DEFAULT_FORMS: Array<
    Pick<
        ApplicationForm,
        "slug" | "name" | "type" | "description" | "url" | "status" | "category" | "sortOrder"
    >
> = [
    {
        slug: "staff",
        name: "Staff Application",
        type: "General Staff Position",
        description:
            "Apply to become a staff member of the Roblox Volleyball League. Help manage the community and ensure smooth operations for each season.",
        url: "https://forms.gle/TgpFMdP8zVmyqKjk6",
        status: "closed",
        category: "staff",
        sortOrder: 1,
    },
    {
        slug: "media",
        name: "Media Team Application",
        type: "Content Creation & Streaming",
        description:
            "Join our media team to create content, stream RVL matches, manage social media, and help promote the league through various platforms.",
        url: "https://forms.gle/L6QFsuztCaJMRQyp8",
        status: "closed",
        category: "media",
        sortOrder: 2,
    },
    {
        slug: "referee",
        name: "Referee Application",
        type: "Game Officiating",
        description:
            "Apply to become a RVL referee and help officiate volleyball matches. Ensure fair play and maintain game rules.",
        url: null,
        status: "closed",
        category: "game-officials",
        sortOrder: 3,
    },
    {
        slug: "moderator",
        name: "Server Moderator Application",
        type: "Community Management",
        description:
            "Help moderate our Discords community spaces, enforce rules, and maintain a positive environment for all members.",
        url: null,
        status: "closed",
        category: "management",
        sortOrder: 4,
    },
    {
        slug: "game-moderator",
        name: "Game Moderator Application",
        type: "Game Officiating",
        description:
            "Help moderate Volleyball 4.2s ranked games, police rule violations, and fair play enforcement for the playerbase.",
        url: null,
        status: "closed",
        category: "game-officials",
        sortOrder: 5,
    },
    {
        slug: "stats",
        name: "Stats Team Application",
        type: "Data Management",
        description:
            "Join our stats team to help track player statistics, game data, and maintain accurate records for RVLs playoffs.",
        url: null,
        status: "closed",
        category: "management",
        sortOrder: 6,
    },
    {
        slug: "host",
        name: "Host Application",
        type: "Event Management",
        description:
            "Apply to become a host and help organize events in games outside of 4.2, and keep the community engaged by hosting casual pickup matches.",
        url: null,
        status: "closed",
        category: "management",
        sortOrder: 7,
    },
];

export class ApplicationFormService {
    private repository = AppDataSource.getRepository(ApplicationForm);

    async ensureSeeded(): Promise<void> {
        const count = await this.repository.count();
        if (count > 0) {
            return;
        }

        await this.repository.save(DEFAULT_FORMS);
    }

    async getAll(): Promise<ApplicationForm[]> {
        await this.ensureSeeded();
        return this.repository.find({
            order: { sortOrder: "ASC", id: "ASC" },
        });
    }

    async updateBySlug(
        slug: string,
        updates: { url?: string | null; status?: ApplicationFormStatus }
    ): Promise<ApplicationForm> {
        await this.ensureSeeded();
        const form = await this.repository.findOne({ where: { slug } });
        if (!form) {
            throw new NotFoundError(`Application form "${slug}" not found`);
        }

        if (updates.url !== undefined) {
            form.url = updates.url === "" ? null : updates.url;
        }
        if (updates.status !== undefined) {
            form.status = updates.status;
        }

        return this.repository.save(form);
    }
}
