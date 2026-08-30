/**
 * ContactUs — the three ways to reach the league: email a team member, join the Discord for ticketed support, or browse the help centre.
 * Each route is one entry in `CONTACT_ROUTES`, rendered as an identical card, so adding a fourth channel doesn't mean copying markup.
 * Lives in `components/`; routed at /contact.
 */
import type { ReactNode } from "react";
import { FaPhoneAlt, FaBook, FaQuestionCircle } from "react-icons/fa";
import PageContainer from "@/components/ui/layout/PageContainer";
import PageHeader from "@/components/ui/layout/PageHeader";
import Card from "@/components/ui/layout/Card";
import LinkButton from "@/components/ui/buttons/LinkButton";

interface ContactRoute {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  to: string;
  external?: boolean;
}

const CONTACT_ROUTES: ContactRoute[] = [
  {
    icon: <FaPhoneAlt />,
    title: "Talk to a team member",
    description: "We’ll help you get the right support and answers when available.",
    actionLabel: "Email Us",
    to: "mailto:aottgpvp@gmail.com",
    external: true,
  },
  {
    icon: <FaBook />,
    title: "Join our Discord",
    description:
      "Hop into our server to get help from the League and Game administration team through our automated ticketing system.",
    actionLabel: "Join Discord",
    to: "https://discord.gg/volleyball",
    external: true,
  },
  {
    icon: <FaQuestionCircle />,
    title: "Help Center",
    description: "Still not sure who to contact? Browse our help center and find quick answers.",
    actionLabel: "Visit Help Center",
    to: "/faq",
  },
];

export default function Contact() {
  return (
    <PageContainer width="wide">
      <PageHeader title="Contact Us" align="center" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CONTACT_ROUTES.map((route) => (
          <Card key={route.title} padding="lg" className="text-center">
            <div className="flex h-full flex-col items-center gap-3">
              <span className="text-3xl text-accent">{route.icon}</span>
              <h2 className="m-0 text-base font-semibold text-content">{route.title}</h2>
              <p className="m-0 flex-1 text-sm text-content-tertiary">{route.description}</p>
              <LinkButton to={route.to} external={route.external} size="sm">
                {route.actionLabel}
              </LinkButton>
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
