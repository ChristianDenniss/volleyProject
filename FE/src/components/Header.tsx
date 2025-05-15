import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "../styles/Header.css";
import rvlLogo from "../images/rvlLogo.png";  // Import the main logo
import pfp from "../images/pfpLogo.png";  // Import the profile picture

const Header: React.FC = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);  

    // Replace with actual auth logic
    const isLoggedIn = false;
    // Replace with actual api call
    const username = "LuvLate";

    // Toggle dropdown when button is clicked
    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

    // Close dropdown when clicking outside of it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        // Cleanup the event listener when component is unmounted
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <header className="site-header">
            <div className="left-section">
                {/* Wrap the logo with Link to make it clickable */}
                <Link to="/">
                    <img src={rvlLogo} alt="Logo" className="logo" />
                </Link>
                <span className="site-name">volleyball-4-2.com</span>
            </div>

            <div className="right-section">
                {isLoggedIn ? (
                    <div className="profile-info">
                        <span className="username">{username}</span>
                        {/* Use the imported profile picture here, wrapped in a Link */}
                        <Link to="/profile">
                            <img src={pfp} alt="Profile Picture" className="avatar" />
                        </Link>
                    </div>
                ) : (
                    <div className="auth-dropdown">
                        <div className="auth-button-wrapper">
                            <span className="auth-text">Guest</span>
                            <button onClick={toggleDropdown} className="dropdown-btn">
                                ☰
                            </button>
                        </div>
                        {dropdownOpen && (
                            <div ref={dropdownRef} className="dropdown-menu">
                                <Link to="/login">Login</Link>
                                <Link to="/signup">Sign Up</Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
