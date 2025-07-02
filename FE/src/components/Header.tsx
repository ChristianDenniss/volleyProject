// src/components/Header.tsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import "../styles/Header.css";
import rvlLogo from "../images/rvlLogo.png";  
// import blueTexture from "../images/blue_texture_strip.png";  
import pfp from "../images/pfpLogo.png";  
import { BACKEND_OAUTH_LOGIN } from "../utils/constants"

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

    // close dropdown when clicking outside
    useEffect(() =>
    {
        const handleClickOutside = (event: MouseEvent) =>
        {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node))
            {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
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
                    <div className="auth-dropdown">
                        <div className="auth-button-wrapper">
                            <span className="auth-text">Guest</span>
                            <button onClick={toggleDropdown} className="dropdown-btn">
                                ☰
                            </button>
                        </div>
                        {dropdownOpen && (
                            <div ref={dropdownRef} className="dropdown-menu">
                                <Link to={BACKEND_OAUTH_LOGIN}>Login</Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
