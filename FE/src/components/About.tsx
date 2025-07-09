import React from "react";
import "../styles/About.css";

const About: React.FC = () =>
{
    return (
        <div className="about-page-container">
            <h1 className="about-title">About Volleyball 4.2</h1>

            <p className="about-intro">
                Welcome to the official platform for Volleyball 4.2, the Pinnacle competitive volleyball experience on Roblox. Our platform serves as the central hub for the Roblox Volleyball League (RVL), providing comprehensive tools for players, teams, and fans.
            </p>

            <section className="about-section">
                <h2 className="section-title">League Management</h2>
                <p>
                    Our platform provides a complete ecosystem for competitive volleyball:
                </p>
                <ul className="feature-list">
                    <li>Comprehensive team management and roster tracking</li>
                    <li>Detailed season organization and scheduling</li>
                    <li>Real-time game statistics and performance metrics</li>
                    <li>Player profiles with career statistics and achievements</li>
                    <li>Automated award tracking and recognition system</li>
                </ul>
            </section>

            <section className="about-section">
                <h2 className="section-title">Statistical Analysis</h2>
                <p>
                    We provide in-depth statistical tracking for every aspect of the game:
                </p>
                <ul className="feature-list">
                    <li>Advanced player performance metrics</li>
                    <li>Team statistics and historical data</li>
                    <li>Season-by-season comparisons</li>
                    <li>Career progression tracking</li>
                    <li>Real-time game statistics</li>
                </ul>
            </section>

            <section className="about-section">
                <h2 className="section-title">Community Features</h2>
                <p>
                    Stay connected with the volleyball community through our integrated features:
                </p>
                <ul className="feature-list">
                    <li>News articles and game highlights</li>
                    <li>Team and player profiles</li>
                    <li>Match schedules and results</li>
                    <li>Community announcements and updates</li>
                    <li>Direct integration with our Discord community</li>
                </ul>
            </section>

            <section className="about-section">
                <h2 className="section-title">Administrative Tools</h2>
                <p>
                    Our platform includes powerful tools for league administration:
                </p>
                <ul className="feature-list">
                    <li>User role management and permissions</li>
                    <li>Content moderation and approval system</li>
                    <li>Team and player registration management</li>
                    <li>Game result verification and validation</li>
                    <li>Comprehensive data management system</li>
                </ul>
            </section>

            <section className="about-section">
                <h2 className="section-title">Getting Started</h2>
                <p>
                    Join our community today by:
                </p>
                <ul className="feature-list">
                    <li>Creating an account to access all features</li>
                    <li>Joining our Discord server for community updates</li>
                    <li>Exploring the Roblox game to start playing</li>
                    <li>Checking out our teams and seasons pages</li>
                    <li>Reading our latest articles and news</li>
                </ul>
            </section>
        </div>
    );
};

export default About;
