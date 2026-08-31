import React from "react";
import SEO from "./SEO";

/* The two decorative bars - the underline beneath the page title and the rule
   beside each section heading - were ::after/::before pseudo-elements, so they
   stay pseudo-elements here. They need an explicit content-[''] to render. */
const aboutTitle =
    "text-[2.5rem] font-extrabold mb-[2rem] text-center text-brand-primary relative pb-[1rem] " +
    "upto-md:text-[2rem] " +
    "after:content-[''] after:absolute after:bottom-0 after:left-1/2 " +
    "after:[transform:translateX(-50%)] after:w-[100px] after:h-[4px] " +
    "after:bg-brand-primary after:rounded-[2px]";

const aboutSection =
    "bg-bg rounded-[var(--radius)] p-[2rem] mb-[2rem] shadow-sm border border-accent-border " +
    "transition-[transform,box-shadow] duration-200 ease-[ease] " +
    "hover:[transform:translateY(-2px)] hover:shadow-md upto-md:p-[1.5rem]";

const sectionTitle =
    "text-[1.5rem] font-bold mb-[1.5rem] text-brand-primary flex items-center gap-[0.75rem] " +
    "upto-md:text-[1.25rem] " +
    "before:content-[''] before:block before:w-[4px] before:h-[24px] " +
    "before:bg-brand-primary before:rounded-[2px]";

const featureList =
    "list-none p-0 m-0 grid gap-[1rem] " +
    "[&_li]:p-[1rem] [&_li]:bg-bg-light [&_li]:rounded-[var(--radius)] [&_li]:text-text " +
    "[&_li]:text-[1rem] [&_li]:leading-[1.5] [&_li]:border [&_li]:border-border " +
    "[&_li]:transition-[transform,border-color] [&_li]:duration-200 [&_li]:ease-[ease] " +
    "[&_li:hover]:[transform:translateX(8px)] [&_li:hover]:border-brand-primary";


const About: React.FC = () =>
{
    return (
        <div className="p-[2rem] w-[80%] mx-auto text-text bg-bg-light [font-family:'Inter',sans-serif] upto-md:p-[1rem] upto-md:w-[95%]">
            <SEO
                title="About"
                description="Learn about Volleyball 4.2 and the Roblox Volleyball League platform for teams, players, and fans."
                url="https://volleyball4-2.com/about"
            />
            <h1 className={aboutTitle}>About Volleyball 4.2</h1>

            <p className="text-[1.25rem] leading-[1.6] text-text-muted mb-[3rem] text-center max-w-[800px] mx-auto upto-md:text-[1.1rem]">
                Welcome to the official platform for Volleyball 4.2, the Pinnacle competitive volleyball experience on Roblox. Our platform serves as the central hub for the Roblox Volleyball League (RVL), providing comprehensive tools for players, teams, and fans.
            </p>

            <section className={aboutSection}>
                <h2 className={sectionTitle}>League Management</h2>
                <p>
                    Our platform provides a complete ecosystem for competitive volleyball:
                </p>
                <ul className={featureList}>
                    <li>Comprehensive team management and roster tracking</li>
                    <li>Detailed season organization and scheduling</li>
                    <li>Real-time game statistics and performance metrics</li>
                    <li>Player profiles with career statistics and achievements</li>
                    <li>Automated award tracking and recognition system</li>
                </ul>
            </section>

            <section className={aboutSection}>
                <h2 className={sectionTitle}>Statistical Analysis</h2>
                <p>
                    We provide in-depth statistical tracking for every aspect of the game:
                </p>
                <ul className={featureList}>
                    <li>Advanced player performance metrics</li>
                    <li>Team statistics and historical data</li>
                    <li>Season-by-season comparisons</li>
                    <li>Career progression tracking</li>
                    <li>Real-time game statistics</li>
                </ul>
            </section>

            <section className={aboutSection}>
                <h2 className={sectionTitle}>Community Features</h2>
                <p>
                    Stay connected with the volleyball community through our integrated features:
                </p>
                <ul className={featureList}>
                    <li>News articles and game highlights</li>
                    <li>Team and player profiles</li>
                    <li>Match schedules and results</li>
                    <li>Community announcements and updates</li>
                    <li>Direct integration with our Discord community</li>
                </ul>
            </section>

            <section className={aboutSection}>
                <h2 className={sectionTitle}>Administrative Tools</h2>
                <p>
                    Our platform includes powerful tools for league administration:
                </p>
                <ul className={featureList}>
                    <li>User role management and permissions</li>
                    <li>Content moderation and approval system</li>
                    <li>Team and player registration management</li>
                    <li>Game result verification and validation</li>
                    <li>Comprehensive data management system</li>
                </ul>
            </section>

            <section className={aboutSection}>
                <h2 className={sectionTitle}>Getting Started</h2>
                <p>
                    Join our community today by:
                </p>
                <ul className={featureList}>
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
