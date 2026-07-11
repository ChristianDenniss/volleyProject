import React, { useMemo } from "react";
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
    FaCheckCircle,
} from "react-icons/fa";
import { useApplications } from "../hooks/allFetch";
import type { Application } from "../types/interfaces";

const APPLICATION_ICONS: Record<string, React.ReactNode> = {
    staff: <FaUsers />,
    media: <FaCamera />,
    referee: <FaFlag />,
    moderator: <FaShieldAlt />,
    "game-moderator": <FaShieldAlt />,
    stats: <FaChartBar />,
    host: <FaMicrophone />,
};

const categories = {
    staff: "Staff Positions",
    media: "Media & Content",
    "game-officials": "Game Officials",
    management: "Management & Support",
};

const Applications: React.FC = () => {
    const { data: applications, loading, error } = useApplications();

    const groupedApplications = useMemo(() => {
        return (applications ?? []).reduce((acc: Record<string, Application[]>, app: Application) => {
            if (!acc[app.category]) {
                acc[app.category] = [];
            }
            acc[app.category].push(app);
            return acc;
        }, {} as Record<string, Application[]>);
    }, [applications]);

    const categoryOrder: Application["category"][] = [
        "staff",
        "media",
        "game-officials",
        "management",
    ];

    if (loading) {
        return <div className="applications-page">Loading applications...</div>;
    }

    if (error) {
        return <div className="applications-page">Error: {error}</div>;
    }

    return (
        <div className="applications-page">
            <div className="applications-grid">
                {categoryOrder.map((category) => {
                    const apps = groupedApplications[category];
                    if (!apps?.length) {
                        return null;
                    }

                    return (
                        <div key={category} className="application-category">
                            <h2 className="category-title">
                                {categories[category]}
                            </h2>
                            <div className="category-apps">
                                {apps.map((app: Application) => (
                                    <div
                                        key={app.slug}
                                        className={`application-card ${app.status}`}
                                    >
                                        <div className="app-icon">
                                            {APPLICATION_ICONS[app.slug] ?? (
                                                <FaUsers />
                                            )}
                                        </div>
                                        <div className="app-content">
                                            <div className="app-header">
                                                <h3 className="app-name">
                                                    {app.name}
                                                </h3>
                                                <div
                                                    className={`status-badge ${app.status}`}
                                                >
                                                    {app.status === "open" ? (
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
                                            <p className="app-description">
                                                {app.description}
                                            </p>
                                            {app.status === "open" && app.url ? (
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
                                                    <span>
                                                        Applications Currently
                                                        Closed
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="applications-footer">
                <h3>Application Information</h3>
                <p>
                    All applications are carefully reviewed by our
                    administration team. We'll contact you if your application
                    is accepted. Make sure to provide detailed and honest
                    responses in your application.
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
