import React from "react";
import "../styles/About.css";

const About: React.FC = () =>
{
    return (
        <div className="about-page-container">
            {/* Page Heading */}
            <h1 className="about-title">About the Volleyball Game Platform</h1>

            {/* Intro Section */}
            <p className="about-intro">
                This is your all-in-one destination for everything volleyball — built for players, coaches, and fans who want more from their game.
            </p>

            {/* Mission Section */}
            <section className="about-section">
                <h2 className="section-title">Our Mission</h2>
                <p>
                    We’re redefining how competitive volleyball is experienced and organized. Whether you’re tracking your team’s rise or checking stats for your next match, our platform is built to serve your journey.
                </p>
            </section>

            {/* Platform Features */}
            <section className="about-section">
                <h2 className="section-title">What You Can Do</h2>
                <ul className="feature-list">
                    <li>🏐 Track live games and results</li>
                    <li>📊 View detailed player & team stats</li>
                    <li>📰 Read news, updates, and highlights</li>
                    <li>📅 Stay updated with match schedules</li>
                    <li>📈 Watch how rankings shift in real time</li>
                </ul>
            </section>

            {/* Community Section */}
            <section className="about-section">
                <h2 className="section-title">Community Driven</h2>
                <p>
                    Built by and for volleyball fans. Players can grow their visibility, teams can connect, and fans can stay closer to the action than ever before.
                </p>
            </section>

            {/* Developer Section */}
            <section className="about-section">
                <h2 className="section-title">Who Made This</h2>
                <p>
                    Created by <strong>Christian Dennis</strong>, a developer at <strong>UNBSJ</strong> who’s passionate about bridging tech and sports. This project is a hands-on effort to modernize amateur volleyball through innovative design and functionality.
                </p>
            </section>
        </div>
    );
};

export default About;
