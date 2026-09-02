import type { Metadata } from "next";
import { PageHeader, PageMetric } from "@components/site/page-header";

export const metadata: Metadata = {
  title: "Credits",
  description: "The contributors who built and run the Volleyball 4-2 league platform.",
};

const CONTRIBUTORS = [
  { name: "LuvLate", role: "Project Lead", avatar: "/images/LuvLate.png" },
  { name: "Stenimated", role: "Systems & Deployment Engineer", avatar: "/images/stenimated.png" },
  { name: "LuvLate", role: "Fullstack Engineer", avatar: "/images/luvlate2.png" },
  { name: "Illoult", role: "Graphic Designer", avatar: "/images/Illoult.png" },
];

export default function CreditsPage() {
  return (
    <div className="font-display">
      <PageHeader
        eyebrow="Colophon"
        title="Contributors"
        description="The people who built this platform and keep it running."
        meta={<PageMetric label="Credits" value={CONTRIBUTORS.length} />}
      />

      <div className="grid grid-cols-1 gap-6 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 xl:px-14">
        {CONTRIBUTORS.map((person) => (
          <div
            key={`${person.name}-${person.role}`}
            className="flex flex-col items-start border border-rvl-line p-6"
          >
            <img
              src={person.avatar}
              alt=""
              className="size-20 rounded-xs border border-rvl-line object-cover"
            />
            <h2 className="mt-5 mb-1 text-[1.15rem] font-bold">{person.name}</h2>
            <p className="m-0 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-rvl-dim">
              {person.role}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
