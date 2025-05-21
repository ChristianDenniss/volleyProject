import React from "react";
import "../styles/ContactUs.css";
import { FaPhoneAlt, FaBook, FaQuestionCircle } from "react-icons/fa";

const Contact: React.FC = () =>
{
    return (
        <div className="contact-page">
            <h1>Contact Us</h1>

            <div className="contact-card-grid">
                <div className="contact-card">
                    <FaPhoneAlt className="contact-icon" />
                    <h2>Talk to a team member</h2>
                    <p>We’ll help you get the right support and answers when available.</p>
                    <a href="mailto:aottgpvp@gmail.com" className="contact-button">Email Us</a>
                </div>

                <div className="contact-card">
                    <FaBook className="contact-icon" />
                    <h2>Join our Discord</h2>
                    <p>Hop into our server to get help from the League and Game administration team through our automated ticketing system.</p>
                    <a
                        href="https://discord.gg/volleyball"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="contact-button"
                    >
                        Join Discord
                    </a>
                </div>
            </div>

            <div className="contact-card contact-card-center">
                <FaQuestionCircle className="contact-icon" />
                <h2>Help Center</h2>
                <p>Still not sure who to contact? Browse our help center and find quick answers.</p>
                <a
                    href="/help"
                    className="contact-button"
                >
                    Visit Help Center
                </a>
            </div>
        </div>
    );
};

export default Contact;
