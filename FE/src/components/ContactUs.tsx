import React from "react";
import { FaPhoneAlt, FaBook, FaQuestionCircle } from "react-icons/fa";

const contactCard =
    "flex-[1_1_40%] max-w-[500px] min-w-[300px] bg-bg border border-accent-border rounded-lg p-[2rem] shadow-sm box-border transition-[transform,box-shadow,border-color] duration-200 ease-[ease] hover:[transform:translateY(-2px)] hover:shadow-md hover:border-brand-primary upto-lg:w-full upto-lg:max-w-full [&_h2]:text-[1.5rem] [&_h2]:font-semibold [&_h2]:mb-[1rem] [&_h2]:text-brand-primary [&_p]:text-[1rem] [&_p]:text-text-muted [&_p]:mb-[1.5rem]";

const contactButton =
    "inline-block bg-brand-primary text-text-on-brand font-semibold py-[0.75rem] px-[2rem] " +
    "rounded-[999px] no-underline border border-brand-primary " +
    "transition-[background-color,border-color] duration-200 ease-[ease] " +
    "hover:bg-brand-primary-hover hover:border-brand-primary-hover";


const Contact: React.FC = () =>
{
    return (
        <div className="max-w-[1200px] mx-auto py-[4rem] px-[2rem] text-center text-text [font-family:'Segoe_UI',Tahoma,Geneva,Verdana,sans-serif]">
            <h1 className="text-[3rem] mb-[3rem] text-brand-primary font-extrabold">Contact Us</h1>

            <div className="flex justify-center gap-[2rem] flex-wrap mb-[2rem] upto-lg:flex-col upto-lg:items-center">
                <div className={contactCard}>
                    <FaPhoneAlt className="text-[2rem] mb-[1rem] text-brand-primary" />
                    <h2>Talk to a team member</h2>
                    <p>We’ll help you get the right support and answers when available.</p>
                    <a href="mailto:aottgpvp@gmail.com" className={contactButton}>Email Us</a>
                </div>

                <div className={contactCard}>
                    <FaBook className="text-[2rem] mb-[1rem] text-brand-primary" />
                    <h2>Join our Discord</h2>
                    <p>Hop into our server to get help from the League and Game administration team through our automated ticketing system.</p>
                    <a
                        href="https://discord.gg/volleyball"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={contactButton}
                    >
                        Join Discord
                    </a>
                </div>
            </div>

            <div className={`${contactCard} mx-auto !max-w-[500px]`}>
                <FaQuestionCircle className="text-[2rem] mb-[1rem] text-brand-primary" />
                <h2>Help Center</h2>
                <p>Still not sure who to contact? Browse our help center and find quick answers.</p>
                <a
                    href="/faq"
                    className={contactButton}
                >
                    Visit Help Center
                </a>
            </div>
        </div>
    );
};

export default Contact;
