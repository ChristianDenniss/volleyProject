import type { Metadata } from "next";
import { api } from "@server/trpc/server";
import { PageHeader } from "@components/site/page-header";
import {
  APPLICATION_CATEGORY_LABELS,
  APPLICATION_CATEGORY_ORDER,
} from "@/lib/applications";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Applications",
  description: "Staff, media, officiating and management positions in the Roblox Volleyball League.",
};

export default async function ApplicationsPage() {
  const rows = await (await api()).applications.list();
  const groups = APPLICATION_CATEGORY_ORDER.map((category) => ({
    category,
    label: APPLICATION_CATEGORY_LABELS[category],
    applications: rows.filter((row) => row.category === category),
  })).filter((group) => group.applications.length > 0);

  return (
    <div className="font-display">
      <PageHeader
        eyebrow="Join the staff"
        title="Applications"
        description="Positions open and closed across the league. Closed positions reopen when we need them, so check back."
      />

      <div>
        {groups.map((group) => (
          <section
            key={group.category}
            className="grid grid-cols-1 gap-8 border-b border-rvl-line px-5 py-12 sm:px-8 md:grid-cols-[210px_1fr] md:gap-14 xl:px-14"
          >
            <div>
              <h2 className="m-0 mb-3 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
                {group.label}
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
                  <div key={application.slug} className="flex flex-col border border-rvl-line p-6">
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
                          href={application.url ?? undefined}
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
