import type { Metadata } from "next";
import { PageHeader, Section } from "@components/site/page-header";
import { Card, CardContent } from "@components/ui/card";

export const metadata: Metadata = {
  title: "Credits",
  description: "The contributors who built and run the Volleyball 4-2 league platform.",
};

const CONTRIBUTORS = [
  { name: "LuvLate", role: "Project lead" },
  { name: "LuvLate", role: "Fullstack engineer" },
  { name: "Stenimated", role: "Systems and deployment engineer" },
  { name: "Illoult", role: "Graphic designer" },
];

export default function CreditsPage() {
  return (
    <>
      <PageHeader
        title="Our contributors"
        description="The folks who brought this project to life."
      />
      <Section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CONTRIBUTORS.map((person) => (
            <Card key={`${person.name}-${person.role}`}>
              <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-brand-sky-pale text-xl font-semibold text-brand-navy-deep">
                  {person.name.slice(0, 2).toUpperCase()}
                </div>
                <p className="text-base font-semibold">{person.name}</p>
                <p className="text-sm text-muted-foreground">{person.role}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}
