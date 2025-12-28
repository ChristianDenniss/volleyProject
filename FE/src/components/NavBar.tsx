import React from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.css"; // Match the path to your CSS file
import { useAuth } from "../context/authContext";

const Navbar: React.FC = () => 
{
    const { isAuthenticated, user } = useAuth();

    return (
        <header>
            <nav className="navbar">
                {/* Left-aligned nav list */}
                <ul className="navbar-links">
                    <li>
                        {/* External link to the RVL game */}
                        <a href="https://discord.gg/volleyball" target="_blank" rel="noopener noreferrer">
                            Roblox Volleyball League
                        </a>
                    </li>
                    <li>
                        {/* External link to the Discord server */}
                        <a href="https://www.roblox.com/games/3840352284/Volleyball-4-2" target="_blank" rel="noopener noreferrer">
                            Play Now
                        </a>
                    </li>
                    <li>
                        <Link to="/schedules">Schedules</Link>
                    </li>
                    <li>
                        <Link to="/stats">Stats</Link>
                    </li>
                    <li>
                        <Link to="/games">Games</Link>
                    </li>
                    <li>
                        <Link to="/teams">Teams</Link>
                    </li>
                    <li>
                        <Link to="/players">Players</Link>
                    </li>
                    <li>
                        <Link to="/seasons">Seasons</Link>
                    </li>
            
                    <li>
                        <Link to="/articles">Articles</Link>
                    </li>
                    <li>
                        <Link to="/faq">FAQ</Link>
                    </li>
                    <li>
                        <Link to="/trivia">Trivia</Link>
                    </li>
                    <li>
                        <Link to="/vector-graph">Vector Graph</Link>
                    </li>

                    {/* ↓↓↓ new: portal link only for admin / superadmin */}
                    {isAuthenticated &&
                      (user?.role === "admin" || user?.role === "superadmin") && (
                        <li>
                            <Link to="/portal">Admin</Link>
                        </li>
                    )}

                </ul>
            </nav>
        </header>
    );
};

export default Navbar;
