import type { Metadata } from "next";

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
  return (
    <div className="mx-auto max-w-[1200px] px-8 py-4 max-md:p-4">
      <header className="mb-12 text-center">
        <h1 className="mb-4 text-[2.5rem] font-bold text-brand-navy max-md:text-[2rem]">
          Applications
        </h1>
        <p className="mx-auto max-w-[800px] text-[1.1rem] leading-relaxed text-[#6b7280]">
          Positions open and closed across the league. Closed positions reopen when we need them, so
          check back.
        </p>
      </header>

      <div className="flex flex-col gap-12">
        {GROUPS.map((group) => (
          <section
            key={group.category}
            className="rounded-xl border border-[#e5e7eb] bg-white p-8 shadow-[0_4px_6px_rgba(0,0,0,0.05)] max-md:p-6"
          >
            <h2 className="mb-6 border-b-2 border-brand-sky pb-3 text-2xl font-semibold text-brand-navy">
              {group.category}
            </h2>

            <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(350px,1fr))] max-md:grid-cols-1 max-md:gap-4">
              {group.applications.map((application) => {
                const closed = application.status !== "open" || !application.url;

                return (
                  <div
                    key={application.name}
                    className={
                      closed
                        ? "relative flex overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#f1f5f9] p-6 opacity-70 max-md:flex-col max-md:items-center max-md:p-5 max-md:text-center"
                        : "group relative flex overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-sky hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)] max-md:flex-col max-md:items-center max-md:p-5 max-md:text-center"
                    }
                  >
                    <span
                      aria-hidden="true"
                      className={
                        closed
                          ? "mr-4 flex size-[60px] shrink-0 items-center justify-center rounded-xl bg-[#94a3b8] text-2xl text-[#64748b] max-md:mx-0 max-md:mb-4 max-md:size-[50px]"
                          : "mr-4 flex size-[60px] shrink-0 items-center justify-center rounded-xl bg-brand-sky text-2xl text-brand-navy transition-all duration-300 group-hover:scale-105 group-hover:bg-brand-navy group-hover:text-white max-md:mx-0 max-md:mb-4 max-md:size-[50px]"
                      }
                    >
                      {closed ? "\u{1F512}" : "\u{1F4DD}"}
                    </span>

                    <div className="flex flex-1 flex-col">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h3 className="m-0 flex-1 text-xl font-semibold text-brand-navy">
                          {application.name}
                        </h3>
                        <span
                          className={
                            closed
                              ? "flex shrink-0 items-center gap-1 rounded-[20px] bg-[#fef2f2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.5px] text-[#dc2626]"
                              : "flex shrink-0 items-center gap-1 rounded-[20px] bg-[#dcfce7] px-3 py-1 text-xs font-semibold uppercase tracking-[0.5px] text-[#166534]"
                          }
                        >
                          {closed ? "Closed" : "Open"}
                        </span>
                      </div>

                      <p className="mb-3 mt-0 text-sm font-medium uppercase tracking-[0.5px] text-[#6b7280]">
                        {application.type}
                      </p>

                      <p className="mb-4 flex-1 text-[0.95rem] leading-normal text-[#4b5563]">
                        {application.description}
                      </p>

                      {closed ? (
                        <span className="inline-flex cursor-not-allowed items-center gap-2 py-2 text-[0.9rem] font-medium text-[#9ca3af]">
                          Currently closed
                        </span>
                      ) : (
                        <a
                          href={application.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 py-2 text-[0.9rem] font-medium text-brand-sky no-underline transition-all duration-300 hover:translate-x-1 hover:text-brand-navy"
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

      <div className="mt-12 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-8 text-center">
        <h3 className="mb-4 text-xl font-semibold text-brand-navy">Application Information</h3>
        <p className="mx-auto mb-6 max-w-[600px] leading-relaxed text-[#6b7280]">
          All applications are carefully reviewed by our administration team. We will contact you if
          your application is accepted. Make sure to provide detailed and honest responses.
        </p>
        <div className="flex flex-wrap justify-center gap-8">
          <span className="flex items-center gap-2 text-[0.9rem] text-[#6b7280]">
            <span className="text-base text-[#166534]">●</span> Applications Open
          </span>
          <span className="flex items-center gap-2 text-[0.9rem] text-[#6b7280]">
            <span className="text-base text-[#dc2626]">●</span> Applications Closed
          </span>
        </div>
      </div>
    </div>
  );
}
