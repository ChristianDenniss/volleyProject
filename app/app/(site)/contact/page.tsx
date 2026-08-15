import type { Metadata } from "next";
import { BookOpen, HelpCircle, Mail } from "lucide-react";
import { PageHeader, Section } from "@components/site/page-header";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach the Volleyball 4-2 league and game administration team.",
};

const CHANNELS = [
  {
    icon: Mail,
    title: "Talk to a team member",
    description: "We will help you get the right support and answers when available.",
    action: { label: "Email us", href: "mailto:aottgpvp@gmail.com", external: true },
  },
  {
    icon: BookOpen,
    title: "Join our Discord",
    description:
      "Hop into our server to reach the league and game administration team through the ticketing system.",
    action: { label: "Join Discord", href: "https://discord.gg/volleyball", external: true },
  },
  {
    icon: HelpCircle,
    title: "Frequently asked questions",
    description: "Not sure who to contact? Browse the answers we give most often.",
    action: { label: "Read the FAQ", href: "/faq", external: false },
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader title="Contact us" description="Three ways to reach the people who run the league." />
      <Section>
        <div className="grid gap-6 md:grid-cols-3">
          {CHANNELS.map((channel) => (
            <Card key={channel.title} className="flex flex-col">
              <CardHeader>
                <channel.icon className="size-6 text-brand-steel" aria-hidden />
                <CardTitle className="mt-2">{channel.title}</CardTitle>
                <CardDescription>{channel.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button asChild variant="outline">
                  <a
                    href={channel.action.href}
                    {...(channel.action.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {channel.action.label}
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}
