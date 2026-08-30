import React from 'react';
import '../styles/Footer.css';
import rvlLogo from "../images/rvlLogo.png";
import { FaYoutube, FaTwitter } from 'react-icons/fa';
import { FaDiscord } from 'react-icons/fa6';

const Footer: React.FC = () =>
{
    return (
        <footer className="footer">
            <div className="footer-top">
                <div className="footer-logo">
                    <img src={rvlLogo} alt="RVL Logo" />
                </div>

                <div className="footer-nav">
                    <a href="/">Home</a>
                    <a 
                        href="https://discord.gg/volleyball"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        RVL
                    </a>
                    
                    <a 
                    href="https://www.roblox.com/games/3840352284/Volleyball-4-2"
                    target="_blank"
                    rel="noopener noreferrer"
                    >
                        Game
                    </a>

                    <a href="/about">About</a>
                    <a href="/privacy-policy">Privacy Policy</a>
                    <a href="/contact">Contact Us</a>
                    <a href="/credits">Credits</a>
                </div>

                <div className="footer-socials">
                    <a
                        href="https://www.youtube.com/@RobloxVolleyballLeague"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="YouTube"
                    >
                        <FaYoutube />
                    </a>
                    <a
                        href="https://discord.gg/volleyball"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Discord"
                    >
                        <FaDiscord />
                    </a>
                    <a
                        href="https://twitter.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Twitter"
                    >
                        <FaTwitter />
                    </a>
                </div>
            </div>

            <hr className="footer-line" />

            <div className="footer-bottom">
                <p>Copyright (C) {new Date().getFullYear()} Volleyball World | All Rights Reserved</p>
            </div>
        </footer>
    );
};

export default Footer;
