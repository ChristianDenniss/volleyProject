// src/components/Header.tsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import "../styles/Header.css";
import rvlLogo from "../images/rvlLogo.png";  
// import blueTexture from "../images/blue_texture_strip.png";  
import pfp from "../images/pfpLogo.png";  

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
        <header className="site-header">
            <div className="left-section">
                {/* clickable logo */}
                <Link to="/">
                    <img src={rvlLogo} alt="Logo" className="logo" />
                </Link>
                <span className="site-name">volleyball-4-2.com</span>
            </div>

            <div className="right-section">
                {isAuthenticated ? (
                    // when logged in, show username and avatar
                    <div className="profile-info">
                        <span className="username">{user?.username}</span>
                        <Link to="/profile">
                            <img src={pfp} alt="Profile Picture" className="avatar" />
                        </Link>
                        <button
                            className="logout-btn"
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
                    <div className="auth-dropdown" ref={dropdownRef}>
                        <div className="auth-button-wrapper">
                            <span className="auth-text">Guest</span>
                            <button
                                onClick={toggleDropdown}
                                className="dropdown-btn"
                                aria-expanded={dropdownOpen}
                                aria-haspopup="menu"
                                aria-label="Account menu"
                            >
                                ☰
                            </button>
                        </div>
                        {dropdownOpen && (
                            <div className="dropdown-menu" role="menu">
                                <Link to="/login" role="menuitem" onClick={() => setDropdownOpen(false)}>Login</Link>
                                <Link to="/signup" role="menuitem" onClick={() => setDropdownOpen(false)}>Sign Up</Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
