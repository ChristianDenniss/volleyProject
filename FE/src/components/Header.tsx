// src/components/Header.tsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import rvlLogo from "../images/rvlLogo.png";
// import blueTexture from "../images/blue_texture_strip.png";
import pfp from "../images/pfpLogo.png";

/* Every `wide` rule is paired with a vp-unset + min-[1800px] twin, because the
   stylesheet declared both: the attribute selector once syncViewportLayout()
   has run, and the media query for the first paint before it has. The pairs are
   spelled out rather than factored into one string so each element's classes
   stay greppable. */

const siteHeader =
    "flex justify-between items-center py-0 px-[2.5rem] h-[50px] bg-white text-[#333] " +
    "w-full box-border border-b border-b-[#ddd] m-0 [font-family:'Inter',sans-serif] " +
    "upto-md:h-auto upto-md:min-h-[50px] upto-md:py-[0.5rem] upto-md:px-[1rem] " +
    "vp-wide:py-0 vp-wide:px-[clamp(1.5rem,1rem_+_1.5vw,2.5rem)] vp-wide:h-header " +
    "vp-unset:min-[1800px]:py-0 vp-unset:min-[1800px]:px-[clamp(1.5rem,1rem_+_1.5vw,2.5rem)] " +
    "vp-unset:min-[1800px]:h-header";

const leftSection =
    "flex items-center gap-[2.5rem] upto-md:gap-[0.75rem] " +
    "vp-wide:gap-[clamp(1.5rem,1rem_+_1.5vw,2.5rem)] " +
    "vp-unset:min-[1800px]:gap-[clamp(1.5rem,1rem_+_1.5vw,2.5rem)]";

const logo =
    "w-[50px] h-[50px] upto-md:w-[2.5rem] upto-md:h-[2.5rem] " +
    "vp-wide:w-[var(--header-logo-size)] vp-wide:h-[var(--header-logo-size)] " +
    "vp-unset:min-[1800px]:w-[var(--header-logo-size)] vp-unset:min-[1800px]:h-[var(--header-logo-size)]";

const siteName =
    "text-[1rem] font-semibold text-chrome whitespace-nowrap " +
    "upto-md:text-[0.875rem] upto-xs:hidden " +
    "vp-wide:text-header vp-unset:min-[1800px]:text-header";

/* font-[1000] is not a typo carried over carelessly - the original really did
   set font-weight: 1000, which clamps to the boldest face available. */
const authText =
    "text-[1.125rem] font-[1000] text-chrome whitespace-nowrap " +
    "upto-md:text-[0.875rem] vp-wide:text-header vp-unset:min-[1800px]:text-header";

const username =
    "text-[1.125rem] font-medium text-chrome " +
    "upto-md:text-[0.875rem] vp-wide:text-header vp-unset:min-[1800px]:text-header";

/* The dropdown trigger and the logout button share a shape; only their hover
   colours differ, so the common part lives here. */
const chromeButton =
    "bg-chrome text-white py-[0.5rem] px-[0.75rem] border-none rounded-[6px] text-[1rem] " +
    "cursor-pointer transition-[background] duration-300 ease-[ease] " +
    "upto-md:text-[0.875rem] upto-md:py-[0.45rem] upto-md:px-[0.65rem] upto-md:ml-[0.75rem] " +
    "vp-wide:text-header vp-wide:py-[var(--nav-link-padding-y)] vp-wide:px-[var(--nav-link-padding-x)] " +
    "vp-unset:min-[1800px]:text-header vp-unset:min-[1800px]:py-[var(--nav-link-padding-y)] " +
    "vp-unset:min-[1800px]:px-[var(--nav-link-padding-x)]";

const dropdownButton = chromeButton + " hover:bg-[#dddddd]";
const logoutButton = chromeButton + " ml-[1.5625rem] hover:bg-[#dddddd] hover:text-chrome";

/* The stylesheet set display:none here and then display:flex in an identical
   selector immediately after, so flex is what ever applied. The menu's real
   visibility has always come from React rendering it conditionally. */
const dropdownMenu =
    "absolute top-[110%] right-0 bg-chrome rounded-[6px] p-[10px] flex flex-col " +
    "shadow-[0_4px_10px_rgba(0,0,0,0.1)] z-[999] min-w-[140px] h-[80px] " +
    "items-center justify-center border border-white";

const dropdownLink = "text-white no-underline mb-[8px] text-[14px] py-[5px] px-0 hover:underline";

const profileInfo = "flex items-center gap-[20px] relative upto-md:gap-[0.75rem]";

const avatarBox =
    "w-[35px] h-[35px] upto-md:w-[2rem] upto-md:h-[2rem] " +
    "vp-wide:w-[clamp(2.1875rem,1.75rem_+_0.65vw,2.75rem)] vp-wide:h-[clamp(2.1875rem,1.75rem_+_0.65vw,2.75rem)] " +
    "vp-unset:min-[1800px]:w-[clamp(2.1875rem,1.75rem_+_0.65vw,2.75rem)] " +
    "vp-unset:min-[1800px]:h-[clamp(2.1875rem,1.75rem_+_0.65vw,2.75rem)]";

const Header: React.FC = () =>
{
    // grab auth state
    const { user, isAuthenticated, logout } = useAuth();

    // router helper for logout
    const navigate = useNavigate();

    // dropdown state
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // toggle dropdown when button is clicked
    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

    // close dropdown when clicking outside or pressing Escape
    useEffect(() =>
    {
        const handleClickOutside = (event: MouseEvent) =>
        {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node))
            {
                setDropdownOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) =>
        {
            if (event.key === "Escape")
            {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return (
        <header className={siteHeader}>
            <div className={leftSection}>
                {/* clickable logo */}
                <Link to="/">
                    <img src={rvlLogo} alt="Logo" className={logo} />
                </Link>
                <span className={siteName}>volleyball-4-2.com</span>
            </div>

            <div className="flex items-center">
                {isAuthenticated ? (
                    // when logged in, show username and avatar
                    <div className={profileInfo}>
                        <span className={username}>{user?.username}</span>
                        <Link to="/profile" className={`block ${avatarBox}`}>
                            <img src={pfp} alt="Profile Picture" className={`${avatarBox} bg-chrome rounded-full cursor-pointer z-[1]`} />
                        </Link>
                        <button
                            className={logoutButton}
                            onClick={() =>
                            {
                                logout();
                                navigate("/");
                            }}
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    // guest dropdown when not logged in
                    <div className="relative" ref={dropdownRef}>
                        <div className="flex items-center gap-[40px]">
                            <span className={authText}>Guest</span>
                            <button
                                onClick={toggleDropdown}
                                className={dropdownButton}
                                aria-expanded={dropdownOpen}
                                aria-haspopup="menu"
                                aria-label="Account menu"
                            >
                                ☰
                            </button>
                        </div>
                        {dropdownOpen && (
                            <div className={dropdownMenu} role="menu">
                                <Link className={dropdownLink} to="/login" role="menuitem" onClick={() => setDropdownOpen(false)}>Login</Link>
                                <Link className={dropdownLink} to="/signup" role="menuitem" onClick={() => setDropdownOpen(false)}>Sign Up</Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
