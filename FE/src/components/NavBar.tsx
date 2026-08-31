import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authContext";

/* The nav has four size states, and they are not all media queries. mobile and
   compact narrow the padding, wide opens it up and switches the links to a
   single non-wrapping row, and the min-[1800px] + vp-unset pair reproduces the
   same wide layout on the first paint, before syncViewportLayout() has written
   the attribute. upto-md repeats what vp-mobile does because the original
   carried both: the attribute wins on specificity, the media query covers the
   frame before it exists. */
const navbar =
    "flex justify-center items-center bg-chrome py-[0.625rem] px-[1.25rem] " +
    "min-h-[70px] h-auto w-full z-[1000] m-0 box-border [font-family:'Inter',sans-serif] " +
    // Only the inline padding changes on narrow screens; the block padding is
    // already 0.625rem, so re-declaring it would be noise.
    "upto-md:px-[1rem] vp-mobile:px-[1rem] vp-compact:px-[1rem] " +
    "vp-wide:py-0 vp-wide:px-[clamp(1.25rem,0.75rem_+_1.25vw,3rem)] vp-wide:min-h-nav " +
    "vp-unset:min-[1800px]:py-0 vp-unset:min-[1800px]:px-[clamp(1.25rem,0.75rem_+_1.25vw,3rem)] " +
    "vp-unset:min-[1800px]:min-h-nav";

/* list-none matters: preflight is not loaded, so the ul keeps the browser's
   default markers and padding unless they are removed explicitly. */
const navbarLinks =
    "flex items-center justify-center flex-wrap list-none " +
    "w-[min(100%,var(--layout-max-width))] p-0 m-0 gap-y-[0.5rem] gap-x-[1.5rem] " +
    "[&_li]:flex [&_li]:items-center " +
    "upto-md:gap-x-[0.875rem] vp-mobile:gap-x-[0.875rem] vp-compact:gap-x-[0.875rem] " +
    "vp-wide:flex-nowrap vp-wide:gap-[var(--nav-link-gap)] " +
    "vp-unset:min-[1800px]:flex-nowrap vp-unset:min-[1800px]:gap-[var(--nav-link-gap)]";

/* transition is `all`, so the hover lift has to change `transform` itself -
   Tailwind's translate utility sets the separate `translate` property. */
const navLink =
    "text-white no-underline text-[1.125rem] font-medium py-[0.5rem] px-[0.75rem] rounded-[6px] " +
    "transition-all duration-200 ease-[ease] whitespace-nowrap " +
    "hover:bg-white hover:text-[#333] hover:font-semibold hover:no-underline " +
    "hover:shadow-[0_4px_10px_rgba(0,0,0,0.5)] hover:[transform:translateY(-2px)] " +
    "upto-md:text-[1rem] upto-md:py-[0.45rem] upto-md:px-[0.65rem] " +
    "vp-mobile:text-[1rem] vp-mobile:py-[0.45rem] vp-mobile:px-[0.65rem] " +
    "vp-wide:text-nav vp-wide:py-[var(--nav-link-padding-y)] vp-wide:px-[var(--nav-link-padding-x)] " +
    "vp-unset:min-[1800px]:text-nav vp-unset:min-[1800px]:py-[var(--nav-link-padding-y)] " +
    "vp-unset:min-[1800px]:px-[var(--nav-link-padding-x)]";

const Navbar: React.FC = () =>
{
    const { isAuthenticated, user } = useAuth();

    return (
        <header>
            <nav className={navbar}>
                {/* Left-aligned nav list */}
                <ul className={navbarLinks}>
                    <li>
                        {/* External link to the Discord server */}
                        <a className={navLink} href="https://discord.gg/volleyball" target="_blank" rel="noopener noreferrer">
                            Join Discord
                        </a>
                    </li>
                    <li>
                        {/* External link to the RVL game */}
                        <a className={navLink} href="https://www.roblox.com/games/3840352284/Volleyball-4-2" target="_blank" rel="noopener noreferrer">
                            Play Now
                        </a>
                    </li>
                    <li>
                        <Link className={navLink} to="/schedules">Schedules</Link>
                    </li>
                    <li>
                        <Link className={navLink} to="/stats">Stats</Link>
                    </li>
                    <li>
                        <Link className={navLink} to="/games">Games</Link>
                    </li>
                    <li>
                        <Link className={navLink} to="/teams">Teams</Link>
                    </li>
                    <li>
                        <Link className={navLink} to="/players">Players</Link>
                    </li>
                    <li>
                        <Link className={navLink} to="/seasons">Seasons</Link>
                    </li>

                    <li>
                        <Link className={navLink} to="/articles">Articles</Link>
                    </li>
                    <li>
                        <Link className={navLink} to="/faq">FAQ</Link>
                    </li>
                    <li>
                        <Link className={navLink} to="/trivia">Trivia</Link>
                    </li>

                    {/* ↓↓↓ new: portal link only for admin / superadmin */}
                    {isAuthenticated &&
                      (user?.role === "admin" || user?.role === "superadmin") && (
                        <li>
                            <Link className={navLink} to="/portal">Admin</Link>
                        </li>
                    )}

                </ul>
            </nav>
        </header>
    );
};

export default Navbar;
