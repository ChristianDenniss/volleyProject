import type { Metadata } from "next";

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
    <div className="min-h-screen overflow-x-hidden bg-[#f9f9fb] p-8 text-[#1a1a1a]">
      <h1 className="relative mb-8 text-center text-[3rem] font-black uppercase max-md:text-[2rem]">
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 -z-1 h-[0.3em] w-[120%] -translate-x-1/2 -translate-y-1/2 -skew-x-[20deg] bg-[#a9d6f5]"
        />
        Our Contributors
      </h1>

      <p className="mx-0 mb-16 mt-0 text-center text-[1.1rem] text-[#555] opacity-80">
        The folks who brought this project to life
      </p>

      <div className="grid w-full grid-cols-4 gap-8 [grid-template-columns:repeat(4,minmax(200px,1fr))] max-lg:grid-cols-2 max-sm:grid-cols-1">
        {CONTRIBUTORS.map((person) => (
          <div
            key={`${person.name}-${person.role}`}
            className="rounded-lg bg-white p-6 text-center shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:scale-105 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
          >
            <img
              src={person.avatar}
              alt={person.name}
              className="mx-auto mb-4 size-[120px] rounded-full border-2 border-[#a9d6f5] object-cover"
            />
            <h3 className="m-0 text-[1.2rem] font-bold">{person.name}</h3>
            <p className="mb-0 mt-1 text-[0.95rem] text-[#555]">{person.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
