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
                This Privacy Policy explains how we collect, use, and protect your information when you use the Volleyball Game platform. By using our service, you agree to the collection and use of information in accordance with this policy.
            </p>

            {/* Section: Data Collection */}
            <section className="privacy-section">
                <h2 className="section-title">What We Collect</h2>
                <ul className="policy-list">
                    <li><strong>Account Information:</strong> Username, email address, and encrypted password</li>
                    <li><strong>Profile Data:</strong> User role (user, admin, superadmin), team associations, and player statistics</li>
                    <li><strong>Game Data:</strong> Match results, team statistics, player performance metrics, and season records</li>
                    <li><strong>Content:</strong> Articles, team information, game highlights, and any other content you submit</li>
                    <li><strong>Usage Data:</strong> Information about how you interact with our platform, including access times and features used</li>
                </ul>
            </section>

            {/* Section: Usage */}
            <section className="privacy-section">
                <h2 className="section-title">How We Use Your Information</h2>
                <ul className="policy-list">
                    <li>To authenticate and manage user accounts and access levels</li>
                    <li>To maintain and display team rosters, game schedules, and season information</li>
                    <li>To generate and display match statistics, player rankings, and team standings</li>
                    <li>To facilitate content sharing and community engagement through articles and highlights</li>
                    <li>To provide administrative tools for team and game management</li>
                    <li>To improve our platform's features, performance, and user experience</li>
                    <li>To communicate important updates about our service</li>
                </ul>
            </section>

            {/* Section: Data Protection */}
            <section className="privacy-section">
                <h2 className="section-title">Data Security</h2>
                <ul className="policy-list">
                    <li>We implement industry-standard security measures to protect your data</li>
                    <li>Passwords are encrypted using bcrypt before storage</li>
                    <li>Authentication is handled through secure JWT tokens</li>
                    <li>Access to sensitive data is restricted based on user roles</li>
                    <li>Regular security audits and updates are performed to maintain data protection</li>
                </ul>
            </section>

            {/* Section: User Roles and Access */}
            <section className="privacy-section">
                <h2 className="section-title">User Roles and Access</h2>
                <ul className="policy-list">
                    <li><strong>Regular Users:</strong> Can view public content, manage their profile, and participate in team activities</li>
                    <li><strong>Team Administrators:</strong> Can manage team information, rosters, and game statistics</li>
                    <li><strong>Admin Users:</strong> Have access to administrative tools and can manage platform content</li>
                    <li><strong>Superadmin Users:</strong> Have full system access and can manage user roles and platform settings</li>
                </ul>
            </section>

            {/* Section: Third-Party Services */}
            <section className="privacy-section">
                <h2 className="section-title">Third-Party Services</h2>
                <ul className="policy-list">
                    <li>We use secure authentication services for user management</li>
                    <li>Analytics tools to improve our service and user experience</li>
                    <li>Media storage services for content hosting</li>
                    <li>These services have their own privacy policies, which we recommend reviewing</li>
                </ul>
            </section>

            {/* Section: User Rights */}
            <section className="privacy-section">
                <h2 className="section-title">Your Rights</h2>
                <ul className="policy-list">
                    <li>Access your personal data and account information</li>
                    <li>Update or correct your profile information</li>
                    <li>Request deletion of your account and associated data</li>
                    <li>Export your data in a portable format</li>
                    <li>Opt-out of non-essential communications</li>
                </ul>
            </section>

            {/* Section: Data Retention */}
            <section className="privacy-section">
                <h2 className="section-title">Data Retention</h2>
                <p>
                    We retain your data for as long as your account is active or as needed to provide you services. Game statistics and team information may be retained for historical records even after account deletion. You can request complete data deletion through our contact page.
                </p>
            </section>

            {/* Section: Changes */}
            <section className="privacy-section">
                <h2 className="section-title">Policy Updates</h2>
                <p>
                    This policy may be updated periodically to reflect changes in our practices or legal requirements. We will notify users of any material changes via email or through the platform. Your continued use of the service after such changes constitutes acceptance of the updated policy.
                </p>
            </section>

            {/* Section: Contact */}
            <section className="privacy-section">
                <h2 className="section-title">Contact Us</h2>
                <p>
                    If you have any questions about this Privacy Policy or our data practices, please contact us through our contact page in hte footer below. We will respond to your inquiry as soon as possible.
                </p>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
