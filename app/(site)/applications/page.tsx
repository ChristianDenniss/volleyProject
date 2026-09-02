import type { Metadata } from "next";
import { PageHeader, PageMetric } from "@components/site/page-header";

export const metadata: Metadata = {
  title: "Applications",
  description: "Staff, media, officiating and management positions in the Roblox Volleyball League.",
};

type Status = "open" | "closed";

interface Application {
  name: string;
  type: string;
  description: string;
  url?: string;
  status: Status;
}

const GROUPS: { category: string; applications: Application[] }[] = [
  {
    category: "Staff positions",
    applications: [
      {
        name: "Staff application",
        type: "General staff position",
        description:
          "Apply to become a staff member of the Roblox Volleyball League. Help manage the community and keep each season running.",
        url: "https://forms.gle/TgpFMdP8zVmyqKjk6",
        status: "closed",
      },
    ],
  },
  {
    category: "Media and content",
    applications: [
      {
        name: "Media team application",
        type: "Content creation and streaming",
        description:
          "Create content, stream RVL matches, manage social media and help promote the league.",
        url: "https://forms.gle/L6QFsuztCaJMRQyp8",
        status: "closed",
      },
    ],
  },
  {
    category: "Game officials",
    applications: [
      {
        name: "Referee application",
        type: "Game officiating",
        description:
          "Officiate volleyball matches, keep play fair and hold the game to its rules.",
        status: "closed",
      },
      {
        name: "Game moderator application",
        type: "Game officiating",
        description:
          "Moderate ranked Volleyball 4.2 games, act on rule violations and keep play fair for everyone.",
        status: "closed",
      },
    ],
  },
  {
    category: "Management and support",
    applications: [
      {
        name: "Server moderator application",
        type: "Community management",
        description:
          "Moderate our Discord spaces, enforce the rules and keep the environment positive.",
        status: "closed",
      },
      {
        name: "Stats team application",
        type: "Data management",
        description:
          "Track player statistics and game data, and keep the records accurate through the playoffs.",
        status: "closed",
      },
      {
        name: "Host application",
        type: "Event management",
        description:
          "Organise events outside Volleyball 4.2 and keep the community active with casual pickup matches.",
        status: "closed",
      },
    ],
  },
];

export default function ApplicationsPage() {
  const all = GROUPS.flatMap((group) => group.applications);
  const open = all.filter((application) => application.status === "open" && application.url).length;

  return (
    <div className="font-display">
      <PageHeader
        eyebrow="Join the staff"
        title="Applications"
        description="Positions open and closed across the league. Closed positions reopen when we need them, so check back."
        meta={
          <>
            <PageMetric label="Positions" value={all.length} />
            <PageMetric label="Open" value={open} />
            <PageMetric label="Closed" value={all.length - open} />
          </>
        }
      />

      <div>
        {GROUPS.map((group) => (
          <section
            key={group.category}
            className="grid grid-cols-1 gap-8 border-b border-rvl-line px-5 py-12 sm:px-8 md:grid-cols-[210px_1fr] md:gap-14 xl:px-14"
          >
            <div>
              <h2 className="m-0 mb-3 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
                {group.category}
              </h2>
              <p className="m-0 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-dim">
                {group.applications.length}{" "}
                {group.applications.length === 1 ? "position" : "positions"}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {group.applications.map((application) => {
                const closed = application.status !== "open" || !application.url;

                return (
                  <div key={application.name} className="flex flex-col border border-rvl-line p-6">
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="m-0 flex-1 text-[1.1rem] font-bold leading-tight">
                          {application.name}
                        </h3>
                        <span
                          className={
                            closed
                              ? "shrink-0 border border-rvl-line px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.18em] text-rvl-dim"
                              : "shrink-0 border border-rvl-mint px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.18em] text-rvl-mint"
                          }
                        >
                          {closed ? "Closed" : "Open"}
                        </span>
                      </div>

                      <p className="m-0 mt-3 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-rvl-dim">
                        {application.type}
                      </p>

                      <p className="m-0 mt-4 flex-1 text-[0.9rem] leading-relaxed text-rvl-ink-2">
                        {application.description}
                      </p>

                      {closed ? (
                        <span className="mt-5 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-dim">
                          Currently closed
                        </span>
                      ) : (
                        <a
                          href={application.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-5 self-start border-b border-rvl-line pb-0.5 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-ink-2 no-underline transition-colors hover:border-rvl-accent-soft hover:text-rvl-accent"
                        >
                          Open the form ↗
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <section className="grid grid-cols-1 gap-8 px-5 py-12 sm:px-8 md:grid-cols-[210px_1fr] md:gap-14 xl:px-14">
        <h2 className="m-0 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
          How it works
        </h2>
        <p className="m-0 max-w-[70ch] text-[0.98rem] leading-relaxed text-rvl-ink-2">
          Every application is read by the administration team. You are contacted on Discord if
          yours is accepted, so keep your contact details current and answer in detail.
        </p>
      </section>
    </div>
  );
}
