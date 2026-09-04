import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Credits",
  description: "The contributors who built and run the Volleyball 4-2 league platform.",
};

const CONTRIBUTORS = [
  { name: "LuvLate", role: "Project Lead", avatar: "/images/LuvLate.png" },
  { name: "Stenimated", role: "Systems & Deployment Engineer", avatar: "/images/stenimated.png" },
  { name: "LuvLate", role: "Fullstack Engineer", avatar: "/images/LuvLate.png" },
  { name: "Illoult", role: "Graphic Designer", avatar: "/images/Illoult.png" },
];

export default function CreditsPage() {
  return (
    <div className="min-h-full overflow-x-hidden bg-rvl-panel px-5 py-12 text-rvl-ink sm:px-8 sm:py-16 xl:px-14">
      <h1 className="relative mb-8 text-center text-[3rem] font-black uppercase max-md:text-[2rem]">
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -z-1 h-[0.3em] w-[120%] -translate-x-1/2 -translate-y-1/2 -skew-x-[20deg] bg-rvl-accent-soft"
        />
        Our Contributors
      </h1>

      <p className="mx-0 mt-0 mb-16 text-center text-[1.1rem] text-rvl-ink-2">
        The folks who brought this project to life
      </p>

      <div className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {CONTRIBUTORS.map((person) => (
          <div
            key={`${person.name}-${person.role}`}
            className="rounded-lg bg-rvl-ground p-6 text-center shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:scale-105 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
          >
            <img
              src={person.avatar}
              alt={person.name}
              className="mx-auto mb-4 size-[120px] rounded-full border-2 border-rvl-accent-soft object-cover"
            />
            <h3 className="m-0 text-[1.2rem] font-bold">{person.name}</h3>
            <p className="mt-1 mb-0 text-[0.95rem] text-rvl-ink-2">{person.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
