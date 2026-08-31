import React from 'react';
import rvlLogo from "../images/rvlLogo.png";
import { FaYoutube, FaTwitter } from 'react-icons/fa';
import { FaDiscord } from 'react-icons/fa6';

/* The footer was styled by two rules at once: Footer.css set the background,
   padding and font, while App.css set text-align, margin, position and
   flex-shrink on the same `.footer` class. Both were unlayered and equally
   specific, so the later import won each overlapping property and the element
   rendered as the merge of the two. What follows is that merge - which is why
   text-center, m-0, relative and shrink-0 appear here despite never having been
   in Footer.css. The App.css rule is deleted in this same commit; leaving it
   would have silently taken back background-color and padding, since unlayered
   CSS outranks any utility. */
const footerRoot =
    "w-full bg-chrome-footer text-white py-[20px] px-0 text-center m-0 relative shrink-0 " +
    "[font-family:'Segoe_UI',Tahoma,Geneva,Verdana,sans-serif]";

const footerLink =
    "text-white no-underline transition-[color] duration-300 ease-[ease] hover:text-accent-pale";

/* transition names `transform`, so the hover has to change `transform` too -
   Tailwind's scale-* utility sets the separate `scale` property, which the
   transition would not animate. */
const socialLink =
    "text-white text-[1.3rem] transition-[transform,color] duration-200 ease-[ease] " +
    "hover:[transform:scale(1.2)] hover:text-accent-pale";

const Footer: React.FC = () =>
{
    return (
        <footer className={footerRoot}>
            <div className="flex justify-between items-center py-0 px-[2rem] flex-wrap">
                <div className="[&>img]:h-[75px]">
                    <img src={rvlLogo} alt="RVL Logo" />
                </div>

                <div className="flex gap-[2rem] flex-wrap justify-center text-[1.1rem] font-medium">
                    <a className={footerLink} href="/">Home</a>
                    <a
                        className={footerLink}
                        href="https://discord.gg/volleyball"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        RVL
                    </a>

                    <a
                        className={footerLink}
                        href="https://www.roblox.com/games/3840352284/Volleyball-4-2"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Game
                    </a>

                    <a className={footerLink} href="/about">About</a>
                    <a className={footerLink} href="/privacy-policy">Privacy Policy</a>
                    <a className={footerLink} href="/contact">Contact Us</a>
                    <a className={footerLink} href="/credits">Credits</a>
                </div>

                <div className="flex gap-[1.5rem] text-[1.3rem] text-white">
                    <a
                        className={socialLink}
                        href="https://www.youtube.com/@RobloxVolleyballLeague"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="YouTube"
                    >
                        <FaYoutube />
                    </a>
                    <a
                        className={socialLink}
                        href="https://discord.gg/volleyball"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Discord"
                    >
                        <FaDiscord />
                    </a>
                    <a
                        className={socialLink}
                        href="https://twitter.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Twitter"
                    >
                        <FaTwitter />
                    </a>
                </div>
            </div>

            {/* border-0 rather than border-none: border-none sets
                --tw-border-style to none, which border-t then reads back when it
                writes border-top-style, leaving no rule at all. */}
            <hr className="mx-[2rem] my-[1rem] border-0 border-t border-t-accent-pale" />

            <div className="text-center relative pb-[10px]">
                <p>Copyright (C) {new Date().getFullYear()} Volleyball World | All Rights Reserved</p>
            </div>
        </footer>
    );
};

export default Footer;
