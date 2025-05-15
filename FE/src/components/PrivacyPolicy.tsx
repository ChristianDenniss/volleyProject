import React from "react";
import "../styles/Privacy.css";

const PrivacyPolicy: React.FC = () => 
{
    return (
        <div className="privacy-page-container">
            {/* Page title */}
            <h1 className="privacy-title">Privacy Policy</h1>

            {/* Introduction */}
            <p className="privacy-intro">
                This Privacy Policy explains how we collect, use, and protect your information when you use the Volleyball Game platform.
            </p>

            {/* Section: Data Collection */}
            <section className="privacy-section">
                <h2 className="section-title">What We Collect</h2>
                <p>
                    We may collect data such as usernames, team associations, match statistics, and any content you voluntarily submit (e.g., articles, highlights).
                </p>
            </section>

            {/* Section: Usage */}
            <section className="privacy-section">
                <h2 className="section-title">How We Use Your Information</h2>
                <ul className="policy-list">
                    <li>To manage player profiles and team data</li>
                    <li>To generate match stats, leaderboards, and rankings</li>
                    <li>To allow community content sharing like highlights and news</li>
                    <li>To improve the platform's features and performance</li>
                </ul>
            </section>

            {/* Section: Data Protection */}
            <section className="privacy-section">
                <h2 className="section-title">Data Security</h2>
                <p>
                    We use secure databases and access controls to protect your information. Sensitive data, like login credentials, is encrypted where applicable.
                </p>
            </section>

            {/* Section: Third-Party Services */}
            <section className="privacy-section">
                <h2 className="section-title">Third-Party Services</h2>
                <p>
                    We may integrate third-party tools for analytics, authentication, or media storage. These providers may have their own privacy practices, which we encourage you to review.
                </p>
            </section>

            {/* Section: User Rights */}
            <section className="privacy-section">
                <h2 className="section-title">Your Rights</h2>
                <p>
                    You have the right to access, modify, or request deletion of your data. Contact us if you'd like to exercise any of these rights.
                </p>
            </section>

            {/* Section: Changes */}
            <section className="privacy-section">
                <h2 className="section-title">Policy Updates</h2>
                <p>
                    This policy may be updated from time to time to reflect changes to our practices or legal obligations. Please review this page periodically for any updates.
                </p>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
