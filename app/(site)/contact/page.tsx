import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@components/site/page-header";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach the Volleyball 4-2 league and game administration team.",
};

const CHANNELS = [
  {
    label: "Email",
    title: "Talk to a team member",
    description: "We will help you get the right support and answers when available.",
    action: { label: "Email us", href: "mailto:aottgpvp@gmail.com", external: true },
  },
  {
    label: "Discord",
    title: "Join our server",
    description:
      "Hop into our server to reach the league and game administration team through the ticketing system.",
    action: { label: "Join Discord", href: "https://discord.gg/volleyball", external: true },
  },
  {
    label: "Self serve",
    title: "Frequently asked questions",
    description: "Not sure who to contact? Browse the answers we give most often.",
    action: { label: "Read the FAQ", href: "/faq", external: false },
  },
];

const actionClass =
  "self-start border-b border-rvl-line pb-0.5 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-rvl-ink-2 no-underline transition-colors group-hover:border-rvl-accent-soft group-hover:text-rvl-accent";

export default function ContactPage() {
  return (
    <div className="font-display">
      <PageHeader
        eyebrow="Get in touch"
        title="Contact"
        description="Three ways to reach the people who run the league. Discord is the fastest."
      />

      <div className="grid grid-cols-1 gap-6 px-5 py-12 sm:px-8 lg:grid-cols-3 xl:px-14">
        {CHANNELS.map((channel) => {
          const body = (
            <>
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-rvl-accent">
                {channel.label}
              </span>
              <h2 className="mt-4 mb-3 text-[1.25rem] font-bold uppercase leading-tight tracking-[-0.02em]">
                {channel.title}
              </h2>
              <p className="m-0 mb-6 text-[0.9rem] text-rvl-ink-2">{channel.description}</p>
              <span className={actionClass}>{channel.action.label} →</span>
            </>
          );

          const className =
            "group flex flex-col border border-rvl-line p-6 text-inherit no-underline transition-colors hover:border-rvl-accent-soft";

          return channel.action.external ? (
            <a
              key={channel.title}
              href={channel.action.href}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
            >
              {body}
            </a>
          ) : (
            <Link key={channel.title} href={channel.action.href} className={className}>
              {body}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
