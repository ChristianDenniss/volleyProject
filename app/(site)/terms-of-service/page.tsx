import type { Metadata } from "next";
import { PageHeader, PageMetric } from "@components/site/page-header";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "Rules for using the Volleyball 4-2 league platform, including sign-in, content, and account access.",
};

const SECTIONS = [
  {
    title: "Using the site",
    items: [
      "This site covers league schedules, stats, articles, and administrative tools for Volleyball 4-2.",
      "Sign in with your Roblox account; you must follow Roblox’s terms when doing so.",
      "Do not attempt to access data or tools your account role does not allow.",
    ],
  },
  {
    title: "Accounts and roles",
    items: [
      "Roles (user, admin, superadmin) control what you can view and change.",
      "League staff may update rosters, stats, and published content as part of running the league.",
      "We may change or revoke access if an account is used to abuse the service.",
    ],
  },
  {
    title: "Content",
    items: [
      "Articles and submissions you post may be displayed publicly on the site.",
      "Do not upload content that violates Roblox rules or applicable law.",
      "We may remove content that is incorrect, abusive, or off-topic for the league.",
    ],
  },
  {
    title: "Availability",
    items: [
      "The site is provided as-is; schedules and stats may change as games are recorded.",
      "We may update or take the service offline for maintenance without notice.",
    ],
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="font-display">
      <PageHeader
        eyebrow="Legal"
        title="Terms of service"
        description="Rules for using this platform. By signing in or browsing the site, you agree to these terms."
        meta={<PageMetric label="Sections" value={SECTIONS.length} />}
      />

      {SECTIONS.map((section) => (
        <section
          key={section.title}
          className="grid grid-cols-1 gap-8 border-b border-rvl-line px-5 py-12 sm:px-8 md:grid-cols-[210px_1fr] md:gap-14 xl:px-14"
        >
          <h2 className="m-0 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
            {section.title}
          </h2>

          <ul className="m-0 max-w-[75ch] list-none border-t border-rvl-line p-0">
            {section.items.map((item) => (
              <li
                key={item}
                className="border-b border-rvl-line py-4 text-[0.98rem] leading-relaxed text-rvl-ink-2"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="m-0 px-5 py-10 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-dim sm:px-8 xl:px-14">
        See also our privacy policy. Questions? Reach us through the contact page.
      </p>
    </div>
  );
}
