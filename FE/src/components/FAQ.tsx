import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/FAQ.css";
import { 
    FaChevronDown, 
    FaChevronUp, 
    FaUsers, 
    FaFileAlt, 
    FaShieldAlt, 
    FaQuestionCircle,
    FaExternalLinkAlt,
    FaDiscord,
    FaGamepad
} from "react-icons/fa";

interface FAQItem {
    id: string;
    question: string;
    answer: string | React.ReactNode;
    category: 'general' | 'applications' | 'rules' | 'technical';
}

interface FAQLink {
    id: string;
    title: string;
    description: string;
    url: string;
    icon: React.ReactNode;
    isExternal?: boolean;
}

const FAQ: React.FC = () => {
    const [openItems, setOpenItems] = useState<Set<string>>(new Set());

    const toggleItem = (id: string) => {
        const newOpenItems = new Set(openItems);
        if (newOpenItems.has(id)) {
            newOpenItems.delete(id);
        } else {
            newOpenItems.add(id);
        }
        setOpenItems(newOpenItems);
    };

    const faqItems: FAQItem[] = [
        {
            id: 'what-is-rvl',
            question: 'What is RVL?',
            answer: 'RVL (Roblox Volleyball League) is a competitive volleyball league within Roblox based in the game Volleyball 4.2. We host regular seasons, tournaments, and events for players to compete, improve, and prove their skills.',
            category: 'general'
        },
        {
            id: 'how-to-join',
            question: 'How do I join RVL?',
            answer: 'To join RVL, simply press the join button on our Discord server quick link above to participate in the community and stay updated on current events.',
            category: 'general'
        },
        {
            id: 'team-signup',
            question: 'How do I sign my team up for RVL?',
            answer: 'Team signups are typically announced through our Discord server when new seasons are starting. We will also be posting signup forms on our website, so keep an eye out for those. Check our announcements channel for registration periods and requirements.',
            category: 'general'
        },
        {
            id: 'how-to-contribute',
            question: 'How do I contribute to RVL?',
            answer: 'There are many ways to contribute to RVL! You can apply for staff positions, help moderate our Discord, create content, stream matches, or simply be an active and positive community member.',
            category: 'general'
        },
        {
            id: 'when-seasons',
            question: 'When do seasons start and end?',
            answer: 'Seasons typically run for several months with specific start and end dates. Each season usually lasts a minimum of 10 weeks with a month gap between seasons. Check our seasons page for current and upcoming season information.',
            category: 'general'
        },
        {
            id: 'application-process',
            question: 'How does the application process work?',
            answer: 'Applications are reviewed by our administration team, mainly by the staff member who is in charge of the division you are applying for. We look for dedicated, responsible individuals who can contribute positively to the league. You\'ll be contacted via discord if your application is accepted.',
            category: 'applications'
        },
        {
            id: 'application-status',
            question: 'How do I know if my application was accepted?',
            answer: 'If your application is accepted, you will be contacted by our administration team through the RVL discord server so please be within it at all times. Please ensure your contact information is accurate in your application.',
            category: 'applications'
        },
        {
            id: 'closed-applications',
            question: 'Why are some applications closed?',
            answer: 'Applications may be closed temporarily when we have sufficient staff for that position, or when we\'re restructuring our team. Check back regularly as positions may reopen.',
            category: 'applications'
        },
        {
            id: 'game-rules',
            question: 'What are the game rules?',
            answer: 'Our game follows standard volleyball rules with some specific adaptations/restrictions for the Roblox platform. Fair play and sportsmanship are expected from all players any violations of these rules will result in punishment. For detailed game rules and guidelines, please check our Discord server.',
            category: 'rules'
        },
        {
            id: 'discord-rules',
            question: 'What are the Discord server rules?',
            answer: 'Our Discord server has community guidelines that promote respect, inclusivity, and positive interaction. For detailed Discord rules and guidelines, please check our Discord server rules channel. Violations may result in warnings or removal from the server.',
            category: 'rules'
        },
        {
            id: 'stats-tracking',
            question: 'How are player statistics tracked?',
            answer: 'Player statistics are tracked manually during or after official matches using our provided stat tracking guidelines then  maintained in our database. Stats include kills, assists, blocks, and many other volleyball metrics.',
            category: 'technical'
        },
        {
            id: 'report-issues',
            question: 'How do I report issues or bugs?',
            answer: 'You can report issues through our Discord server support channel, our websites contact-us page, or by reaching out to our technical team directly.',
            category: 'technical'
        },
        {
            id: 'discord-channels',
            question: 'Why can\'t I see/type in channels but I\'m verified?',
            answer: 'This usually happens when only one verification bot is being used. Make sure you\'ve completed verification with all required bots in our Discord server. Check the verification channel for instructions.',
            category: 'technical'
        },
        {
            id: 'what-is-bloxlink',
            question: 'What is Bloxlink?',
            answer: 'Bloxlink is a Discord bot that links your Discord account to your Roblox account for verification purposes. It helps us ensure that Discord users are legitimate Roblox players.',
            category: 'technical'
        },
        {
            id: 'what-is-dc-verified',
            question: 'What is DC Verified?',
            answer: 'DC Verified is a verification system that confirms your Discord account is legitimate and not a bot or fake account. It\'s one of the verification steps required to access our Discord channels to minimize occurences of alts in our league.',
            category: 'technical'
        },
        {
            id: 'how-to-verify',
            question: 'How do I verify?',
            answer: 'Type /verify in the verification channel and wait for the commands to load. Then press the bot you\'d like to verify with (DC Verified or Bloxlink) and follow the prompted instructions. The process is the same for both verification methods.',
            category: 'technical'
        },
        {
            id: 'why-cant-verify',
            question: 'Why can\'t I verify?',
            answer: 'If you\'re having trouble verifying, make sure your Discord account is legitimate, your Roblox account is active, and you\'re following all verification instructions. Contact a moderator if you continue to have issues.',
            category: 'technical'
        }
    ];

    const faqLinks: FAQLink[] = [
        {
            id: 'discord',
            title: 'Join Discord',
            description: 'Join our Discord server to connect with the community, get help, and stay updated on events.',
            url: 'https://discord.gg/volleyball',
            icon: <FaDiscord />,
            isExternal: true
        },
        {
            id: 'game',
            title: 'Play Volleyball 4.2',
            description: 'Play the official Roblox Volleyball League game and experience competitive volleyball matches.',
            url: 'https://www.roblox.com/games/3840352284/Volleyball-4-2',
            icon: <FaGamepad />,
            isExternal: true
        },
        {
            id: 'applications',
            title: 'Staff Applications',
            description: 'Apply for various positions within RVL including staff, media, referees, and more.',
            url: '/applications',
            icon: <FaUsers />
        },
        {
            id: 'about',
            title: 'About RVL',
            description: 'Learn more about the Roblox Volleyball League, our history, and mission.',
            url: '/about',
            icon: <FaQuestionCircle />
        },
        {
            id: 'privacy',
            title: 'Privacy Policy',
            description: 'Read our privacy policy to understand how we handle your data and information.',
            url: '/privacy-policy',
            icon: <FaShieldAlt />
        },
        {
            id: 'contact',
            title: 'Contact Us',
            description: 'Get in touch with our team for support, questions, or feedback.',
            url: '/contact',
            icon: <FaFileAlt />
        }
    ];

    const categories = {
        general: 'General Questions',
        applications: 'Applications & Staff',
        rules: 'Rules & Guidelines',
        technical: 'Technical & Support'
    };

    const groupedFAQ = faqItems.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, FAQItem[]>);

    return (
        <div className="faq-page">
            <div className="faq-header">
                <h1>Frequently Asked Questions</h1>
                <p>Find answers to common questions about RVL and quick links to important pages</p>
            </div>

            <div className="faq-content">
                <div className="faq-links-section">
                    <h2>Quick Links</h2>
                    <div className="faq-links-grid">
                        {faqLinks.map((link) => (
                            link.isExternal ? (
                                <a key={link.id} href={link.url} className="faq-link-card" target="_blank" rel="noopener noreferrer">
                                    <div className="link-icon">
                                        {link.icon}
                                    </div>
                                    <div className="link-content">
                                        <h3>{link.title}</h3>
                                        <p>{link.description}</p>
                                    </div>
                                    <FaExternalLinkAlt className="external-link-icon" />
                                </a>
                            ) : (
                                <Link key={link.id} to={link.url} className="faq-link-card">
                                    <div className="link-icon">
                                        {link.icon}
                                    </div>
                                    <div className="link-content">
                                        <h3>{link.title}</h3>
                                        <p>{link.description}</p>
                                    </div>
                                    <FaExternalLinkAlt className="external-link-icon" />
                                </Link>
                            )
                        ))}
                    </div>
                </div>

                <div className="faq-questions-section">
                    <h2>Common Questions</h2>
                    {Object.entries(groupedFAQ).map(([category, items]) => (
                        <div key={category} className="faq-category">
                            <h3 className="category-title">{categories[category as keyof typeof categories]}</h3>
                            <div className="faq-items">
                                {items.map((item) => (
                                    <div key={item.id} className="faq-item">
                                        <button 
                                            className="faq-question"
                                            onClick={() => toggleItem(item.id)}
                                            aria-expanded={openItems.has(item.id)}
                                        >
                                            <span>{item.question}</span>
                                            {openItems.has(item.id) ? <FaChevronUp /> : <FaChevronDown />}
                                        </button>
                                        {openItems.has(item.id) && (
                                            <div className="faq-answer">
                                                {item.answer}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FAQ; 