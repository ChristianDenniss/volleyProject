import React, { useMemo } from "react";
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
import { isSafeExternalUrl } from "../utils/url";

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

/* Category chrome used to come from `.application-category:nth-child(N)` -
   first rendered block navy, second green, and so on, not from the category
   name. Empty categories are skipped in the markup, so the slot is the
   index among the blocks that actually appear. */
const SLOT_STYLES = [
    { title: "border-b-brand-primary", icon: "bg-brand-primary text-white", link: "text-brand-primary" },
    { title: "border-b-[#10b981]", icon: "bg-[#10b981] text-white", link: "text-[#10b981]" },
    { title: "border-b-[#f59e0b]", icon: "bg-[#f59e0b] text-white", link: "text-[#f59e0b]" },
    { title: "border-b-[#ef4444]", icon: "bg-[#ef4444] text-white", link: "text-[#ef4444]" },
] as const;

const SLOT_FALLBACK = {
    title: "border-b-accent",
    icon: "bg-accent text-brand-primary",
    link: "text-accent",
};

const page =
    "max-w-[1200px] mx-auto py-[1rem] px-[2rem] " +
    "[font-family:'Segoe_UI',Tahoma,Geneva,Verdana,sans-serif] " +
    "upto-md:p-[1rem] upto-xs:p-[0.75rem] upto-360:p-[0.5rem]";

const header =
    "flex items-center justify-between gap-[2rem] mt-[2rem] mb-[2rem] -mx-[2rem] text-left " +
    "upto-md:flex-col upto-md:items-start upto-md:gap-[1rem] " +
    "upto-md:mt-[1.5rem] upto-md:mb-[1.5rem] upto-md:-mx-[1rem] " +
    "upto-xs:mb-[1.25rem] upto-xs:-mx-[0.75rem]";

const headerBody = "flex-1 min-w-0";

const headerTitle =
    "text-[1.25rem] text-brand-primary mt-0 mr-0 mb-[0.5rem] ml-0 font-semibold " +
    "upto-md:text-[1.1rem] upto-xs:text-[1rem] upto-xs:mb-[0.375rem]";

const headerLead =
    "text-[#6b7280] leading-[1.5] m-0 max-w-none " +
    "upto-md:text-[0.9rem] upto-xs:text-[0.85rem]";

const statusLegend =
    "flex justify-end gap-[1.5rem] shrink-0 flex-nowrap " +
    "upto-md:flex-row upto-md:gap-[1rem] upto-md:justify-start upto-md:flex-wrap upto-md:items-center";

const legendItem =
    "flex items-center gap-[0.5rem] text-[0.9rem] text-[#6b7280] " +
    "upto-md:text-[0.85rem] upto-xs:text-[0.8rem]";

const grid = "flex flex-col gap-[3rem]";

const categoryCard =
    "bg-white rounded-[12px] p-[2rem] shadow-[0_4px_6px_rgba(0,0,0,0.05)] border border-[#e5e7eb] " +
    "upto-md:p-[1.5rem] upto-xs:p-[1rem] upto-xs:rounded-[8px] upto-360:p-[0.75rem]";

const categoryTitleBase =
    "text-[1.5rem] text-brand-primary mb-[1.5rem] pb-[0.75rem] border-b-2 font-semibold " +
    "upto-xs:text-[1.25rem] upto-xs:mb-[1rem] upto-xs:pb-[0.5rem]";

const categoryApps =
    "grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-[1.5rem] " +
    "upto-md:grid-cols-[1fr] upto-md:gap-[1rem]";

const appContent = "flex-1 flex flex-col";

const appHeader =
    "flex justify-between items-start mb-[0.5rem] " +
    "upto-md:flex-col upto-md:items-center upto-md:gap-[0.75rem] upto-md:mb-[0.75rem]";

const appName =
    "text-[1.25rem] font-semibold text-brand-primary m-0 flex-1 " +
    "upto-md:text-[1.1rem] upto-md:text-center upto-xs:text-[1rem] upto-360:text-[0.95rem]";

const appType =
    "text-[0.875rem] text-[#6b7280] font-medium mt-0 mr-0 mb-[0.75rem] ml-0 uppercase tracking-[0.5px] " +
    "upto-md:text-[0.8rem] upto-md:mb-[0.5rem] upto-xs:text-[0.75rem] upto-xs:mb-[0.4rem]";

const appDescription =
    "text-[0.95rem] text-[#4b5563] leading-[1.5] mt-0 mr-0 mb-[1rem] ml-0 flex-1 " +
    "upto-md:text-[0.9rem] upto-md:mb-[0.75rem] upto-xs:text-[0.85rem] upto-xs:mb-[0.6rem] " +
    "upto-360:text-[0.8rem]";

const externalIcon =
    "text-[0.8rem] transition-[transform] duration-300 ease-[ease] group-hover/link:[transform:translateX(2px)]";

function slotOf(index: number) {
    return SLOT_STYLES[index] ?? SLOT_FALLBACK;
}

function cardClasses(closed: boolean) {
    const base =
        "group flex rounded-[8px] p-[1.5rem] border border-[#e2e8f0] " +
        "transition-all duration-300 ease-[ease] relative overflow-hidden " +
        "upto-md:flex-col upto-md:text-center upto-md:p-[1.25rem] " +
        "upto-xs:p-[1rem] upto-xs:rounded-[6px] upto-360:p-[0.75rem]";
    if (closed) {
        return (
            `${base} opacity-70 bg-[#f1f5f9] ` +
            "hover:shadow-[0_4px_6px_rgba(0,0,0,0.05)] hover:border-[#e2e8f0]"
        );
    }
    return (
        `${base} bg-[#f8fafc] ` +
        "hover:[transform:translateY(-2px)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)] hover:border-accent"
    );
}

function iconClasses(slot: number, closed: boolean) {
    const colors = slotOf(slot).icon;
    const base =
        "flex items-center justify-center w-[60px] h-[60px] rounded-[12px] mr-[1rem] shrink-0 text-[1.5rem] " +
        `transition-all duration-300 ease-[ease] ${colors} ` +
        "upto-md:m-0 upto-md:mb-[1rem] upto-md:self-center upto-md:w-[50px] upto-md:h-[50px] upto-md:text-[1.25rem] " +
        "upto-xs:w-[45px] upto-xs:h-[45px] upto-xs:text-[1.1rem] upto-xs:mb-[0.75rem] " +
        "upto-360:w-[40px] upto-360:h-[40px] upto-360:text-[1rem]";
    /* nth-child outranked the open hover colour change, so open cards keep
       their slot colour and only scale. Closed hover outranked nth-child, so
       those icons still go grey. */
    if (closed) {
        return `${base} group-hover:bg-[#94a3b8] group-hover:text-[#64748b]`;
    }
    return `${base} group-hover:[transform:scale(1.05)]`;
}

function badgeClasses(open: boolean) {
    const base =
        "flex items-center gap-[0.25rem] py-[0.25rem] px-[0.75rem] rounded-[20px] " +
        "text-[0.75rem] font-semibold uppercase tracking-[0.5px] shrink-0 " +
        "upto-md:text-[0.7rem] upto-md:py-[0.2rem] upto-md:px-[0.6rem] " +
        "upto-xs:text-[0.65rem] upto-xs:py-[0.15rem] upto-xs:px-[0.5rem]";
    return `${base} ${open ? "bg-[#dcfce7] text-[#166534]" : "bg-[#fef2f2] text-[#dc2626]"}`;
}

function linkClasses(slot: number, disabled: boolean) {
    const base =
        "inline-flex items-center gap-[0.5rem] no-underline font-medium text-[0.9rem] " +
        "transition-all duration-300 ease-[ease] py-[0.5rem] " +
        "upto-md:justify-center upto-md:text-[0.85rem] upto-md:py-[0.4rem] " +
        "upto-xs:text-[0.8rem] upto-xs:py-[0.3rem] " +
        slotOf(slot).link;
    /* nth-child also outranked `.app-link.disabled` for colour, so a closed
       link keeps the slot colour and only loses the slide. */
    if (disabled) {
        return `${base} cursor-not-allowed`;
    }
    return `${base} hover:[transform:translateX(4px)]`;
}

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

    const renderedCategories = categoryOrder.filter(
        (category) => groupedApplications[category]?.length
    );

    if (loading) {
        return <div className={page}>Loading applications...</div>;
    }

    if (error) {
        return <div className={page}>Error: {error}</div>;
    }

    return (
        <div className={page}>
            <div className={header}>
                <div className={headerBody}>
                    <h3 className={headerTitle}>Application Information</h3>
                    <p className={headerLead}>
                        All applications are carefully reviewed by our administration team.
                        Open positions accept submissions through their linked forms; closed
                        positions are not currently hiring. We'll reach out if your application
                        is accepted. Please provide detailed, honest responses about your
                        experience, availability, and interest in the role.
                    </p>
                </div>
                <div className={statusLegend}>
                    <div className={legendItem}>
                        <FaCheckCircle className="text-[1rem] text-[#166534]" />
                        <span>Applications Open</span>
                    </div>
                    <div className={legendItem}>
                        <FaLock className="text-[1rem] text-[#dc2626]" />
                        <span>Applications Closed</span>
                    </div>
                </div>
            </div>

            <div className={grid}>
                {renderedCategories.map((category, slot) => {
                    const apps = groupedApplications[category];
                    const slotStyles = slotOf(slot);

                    return (
                        <div key={category} className={categoryCard}>
                            <h2 className={`${categoryTitleBase} ${slotStyles.title}`}>
                                {categories[category]}
                            </h2>
                            <div className={categoryApps}>
                                {apps.map((app: Application) => {
                                    const closed = app.status !== "open";
                                    return (
                                        <div
                                            key={app.slug}
                                            className={cardClasses(closed)}
                                        >
                                            <div className={iconClasses(slot, closed)}>
                                                {APPLICATION_ICONS[app.slug] ?? (
                                                    <FaUsers />
                                                )}
                                            </div>
                                            <div className={appContent}>
                                                <div className={appHeader}>
                                                    <h3 className={appName}>
                                                        {app.name}
                                                    </h3>
                                                    <div className={badgeClasses(!closed)}>
                                                        {closed ? (
                                                            <>
                                                                <FaLock />
                                                                <span>Closed</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FaCheckCircle />
                                                                <span>Open</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className={appType}>{app.type}</p>
                                                <p className={appDescription}>
                                                    {app.description}
                                                </p>
                                                {app.status === "open" && isSafeExternalUrl(app.url) ? (
                                                    <a
                                                        href={app.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`group/link ${linkClasses(slot, false)}`}
                                                    >
                                                        <span>Apply Now</span>
                                                        <FaExternalLinkAlt className={externalIcon} />
                                                    </a>
                                                ) : (
                                                    <div className={linkClasses(slot, true)}>
                                                        <span>
                                                            Applications Currently
                                                            Closed
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Applications;
