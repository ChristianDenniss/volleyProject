import React from "react";
import "../styles/Applications.css";
import { 
    FaUsers, 
    FaCamera, 
    FaFlag, 
    FaShieldAlt, 
    FaChartBar, 
    FaMicrophone,
    FaExternalLinkAlt,
    FaLock,
    FaCheckCircle
} from "react-icons/fa";

interface ApplicationForm {
    id: string;
    name: string;
    type: string;
    description: string;
    url?: string;
    status: 'open' | 'closed';
    icon: React.ReactNode;
    category: 'staff' | 'media' | 'game-officials' | 'management';
}

const Applications: React.FC = () => {
    const applicationForms: ApplicationForm[] = [
        {
            id: 'staff',
            name: 'Staff Application',
            type: 'General Staff Position',
            description: 'Apply to become a staff member of the Roblox Volleyball League. Help manage the community and ensure smooth operations.',
            url: 'https://forms.gle/TgpFMdP8zVmyqKjk6',
            status: 'open',
            icon: <FaUsers />,
            category: 'staff'
        },
        {
            id: 'media',
            name: 'Media Team Application',
            type: 'Content Creation & Media',
            description: 'Join our media team to create content, manage social media, and help promote the league through various platforms.',
            url: 'https://forms.gle/L6QFsuztCaJMRQyp8',
            status: 'open',
            icon: <FaCamera />,
            category: 'media'
        },
        {
            id: 'referee',
            name: 'Referee Application',
            type: 'Game Officiating',
            description: 'Apply to become a referee and help officiate volleyball matches. Ensure fair play and maintain game rules.',
            status: 'closed',
            icon: <FaFlag />,
            category: 'game-officials'
        },
        {
            id: 'moderator',
            name: 'Moderator Application',
            type: 'Community Management',
            description: 'Help moderate our community spaces, enforce rules, and maintain a positive environment for all members.',
            status: 'closed',
            icon: <FaShieldAlt />,
            category: 'management'
        },
        {
            id: 'stats',
            name: 'Stats Team Application',
            type: 'Data Management',
            description: 'Join our stats team to help track player statistics, game data, and maintain accurate records for the league.',
            status: 'closed',
            icon: <FaChartBar />,
            category: 'management'
        },
        {
            id: 'host',
            name: 'Host Application',
            type: 'Event Management',
            description: 'Apply to become a host and help organize events, tournaments, and special activities for the league.',
            status: 'closed',
            icon: <FaMicrophone />,
            category: 'management'
        }
    ];

    const categories = {
        staff: 'Staff Positions',
        media: 'Media & Content',
        'game-officials': 'Game Officials',
        management: 'Management & Support'
    };

    const groupedApplications = applicationForms.reduce((acc, app) => {
        if (!acc[app.category]) {
            acc[app.category] = [];
        }
        acc[app.category].push(app);
        return acc;
    }, {} as Record<string, ApplicationForm[]>);

    return (
        <div className="applications-page">
            <div className="applications-header">
                <h1>Staff Applications</h1>
                <p>Apply to join the Roblox Volleyball League team in various positions</p>
            </div>

            <div className="applications-grid">
                {Object.entries(groupedApplications).map(([category, apps]) => (
                    <div key={category} className="application-category">
                        <h2 className="category-title">{categories[category as keyof typeof categories]}</h2>
                        <div className="category-apps">
                            {apps.map((app) => (
                                <div key={app.id} className={`application-card ${app.status}`}>
                                    <div className="app-icon">
                                        {app.icon}
                                    </div>
                                    <div className="app-content">
                                        <div className="app-header">
                                            <h3 className="app-name">{app.name}</h3>
                                            <div className={`status-badge ${app.status}`}>
                                                {app.status === 'open' ? (
                                                    <>
                                                        <FaCheckCircle />
                                                        <span>Open</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaLock />
                                                        <span>Closed</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <p className="app-type">{app.type}</p>
                                        <p className="app-description">{app.description}</p>
                                        {app.status === 'open' && app.url ? (
                                            <a 
                                                href={app.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="app-link"
                                            >
                                                <span>Apply Now</span>
                                                <FaExternalLinkAlt className="external-link-icon" />
                                            </a>
                                        ) : (
                                            <div className="app-link disabled">
                                                <span>Applications Currently Closed</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="applications-footer">
                <h3>Application Information</h3>
                <p>
                    All applications are carefully reviewed by our administration team. 
                    We'll contact you if your application is accepted. 
                    Make sure to provide detailed and honest responses in your application.
                </p>
                <div className="status-legend">
                    <div className="legend-item">
                        <FaCheckCircle className="legend-icon open" />
                        <span>Applications Open</span>
                    </div>
                    <div className="legend-item">
                        <FaLock className="legend-icon closed" />
                        <span>Applications Closed</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Applications;
