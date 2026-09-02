import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach the Volleyball 4-2 league and game administration team.",
};

const CHANNELS = [
  {
    icon: "✉️",
    title: "Talk to a team member",
    description: "We will help you get the right support and answers when available.",
    action: { label: "Email us", href: "mailto:aottgpvp@gmail.com", external: true },
  },
  {
    icon: "💬",
    title: "Join our Discord",
    description:
      "Hop into our server to reach the league and game administration team through the ticketing system.",
    action: { label: "Join Discord", href: "https://discord.gg/volleyball", external: true },
  },
];

const FAQ_CHANNEL = {
  icon: "❓",
  title: "Frequently asked questions",
  description: "Not sure who to contact? Browse the answers we give most often.",
  action: { label: "Read the FAQ", href: "/faq" },
};

const cardClass =
  "box-border w-full min-w-[300px] max-w-[500px] flex-1 rounded-xl border border-[#ddd] bg-[#f9f9f9] p-8 shadow-[0_2px_6px_rgba(0,0,0,0.06)]";
const buttonClass =
  "inline-block rounded-full bg-brand-sky-pale px-8 py-3 font-semibold text-black no-underline transition-colors duration-300 hover:bg-[#b8d9f2]";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-8 py-16 text-center max-md:px-4 max-md:py-10">
      <h1 className="mb-12 text-[3rem] font-bold max-md:text-[2rem]">Contact Us</h1>

      <div className="mb-8 flex flex-wrap justify-center gap-8 max-[900px]:flex-col max-[900px]:items-center">
        {CHANNELS.map((channel) => (
          <div key={channel.title} className={cardClass}>
            <div className="mb-4 text-[2rem]">{channel.icon}</div>
            <h2 className="mb-4 text-2xl font-semibold">{channel.title}</h2>
            <p className="mb-6 text-base text-[#444]">{channel.description}</p>
            <a
              href={channel.action.href}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass}
            >
              {channel.action.label}
            </a>
          </div>
        ))}
      </div>

      <div className={`${cardClass} mx-auto`}>
        <div className="mb-4 text-[2rem]">{FAQ_CHANNEL.icon}</div>
        <h2 className="mb-4 text-2xl font-semibold">{FAQ_CHANNEL.title}</h2>
        <p className="mb-6 text-base text-[#444]">{FAQ_CHANNEL.description}</p>
        <Link href={FAQ_CHANNEL.action.href} className={buttonClass}>
          {FAQ_CHANNEL.action.label}
        </Link>
      </div>
    </div>
  );
}
