import React from "react";

// Import your images as modules
import LuvLateAvatar from "../images/LuvLate.png";
// import ArticKitsuuAvatar from "../images/ArticKitsuu.png";
import IlloultAvatar from "../images/Illoult.png";
// import capitandeAvatar from "../images/capitande.png";
import stenimatedAvatar from "../images/stenimated.png";

/**
 * The contributors, in display order. Two entries share an avatar by design -
 * LuvLate is credited for two separate roles, exactly as before.
 *
 * The staggered entrance previously came from `.credit-card:nth-child(N)` rules
 * in Credits.css; the delay now rides on the index so it keeps working when the
 * list grows past the four cards those rules covered.
 */
const CONTRIBUTORS = [
  { name: "LuvLate", role: "Project Lead", avatar: LuvLateAvatar, alt: "LuvLate" },
  { name: "Stenimated", role: "Systems & Deployment Engineer", avatar: stenimatedAvatar, alt: "stenimated" },
  { name: "LuvLate", role: "Fullstack Engineer", avatar: LuvLateAvatar, alt: "LuvLate" },
  { name: "Illoult", role: "Graphic Designer", avatar: IlloultAvatar, alt: "Illoult" },
];

const CreditsPage: React.FC = () => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f9f9fb] p-8 font-['Segoe_UI',sans-serif] text-[#1a1a1a]">
      {/* The heading is gradient-filled text with a skewed highlight bar behind it.
          The bar was a ::before rule; it stays a pseudo-element here. */}
      <h1
        className="relative mb-8 animate-shimmer bg-gradient-to-r from-[#1a1a1a] from-20% via-[#a9d6f5] via-40% to-[#1a1a1a] to-60% bg-[length:200%_auto] bg-clip-text text-center text-5xl font-black uppercase text-transparent
                   before:absolute before:left-1/2 before:top-1/2 before:z-[-1] before:h-[0.3em] before:w-[120%] before:-translate-x-1/2 before:-translate-y-1/2 before:skew-x-[-20deg] before:bg-[#a9d6f5] before:content-['']"
      >
        Our Contributors
      </h1>

      <p className="mx-0 mb-16 mt-0 text-center text-[1.1rem] text-[#555] opacity-80">
        The folks who brought this project to life
      </p>

      <div className="grid w-full grid-cols-[repeat(4,minmax(200px,1fr))] gap-8">
        {CONTRIBUTORS.map((contributor, index) => (
          <div
            key={`${contributor.name}-${contributor.role}`}
            style={{ animationDelay: `${(index + 1) * 0.1}s` }}
            className="translate-y-5 animate-card-in rounded-md bg-white p-6 text-center opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-[transform,box-shadow] duration-300 ease-[ease] hover:-translate-y-1.5 hover:scale-105 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
          >
            <img
              src={contributor.avatar}
              alt={contributor.alt}
              className="mb-4 h-[120px] w-[120px] rounded-full border-2 border-[#a9d6f5] object-cover"
            />
            <h3 className="m-0 text-[1.2rem] font-bold">{contributor.name}</h3>
            <p className="mx-0 mb-0 mt-1 text-[0.95rem] text-[#555]">{contributor.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreditsPage;
