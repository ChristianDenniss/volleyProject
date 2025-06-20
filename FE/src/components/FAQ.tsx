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
    FaExternalLinkAlt
} from "react-icons/fa";

interface FAQItem {
    id: string;
    question: string;
    answer: string | React.ReactNode;
    category: 'general' | 'applications' | 'rules' | 'technical' | 'navigation';
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
            answer: 'RVL (Roblox Volleyball League) is a competitive volleyball league within Roblox. We host regular seasons, tournaments, and events for players to compete and improve their skills.',
            category: 'general'
        },
        {
            id: 'how-to-join',
            question: 'How do I join RVL?',
            answer: 'To join RVL, you can apply for various staff positions through our applications page, or simply join our Discord server to participate in the community and stay updated on events.',
            category: 'general'
        },
        {
            id: 'when-seasons',
            question: 'When do seasons start and end?',
            answer: 'Seasons typically run for several months with specific start and end dates. Check our seasons page for current and upcoming season information.',
            category: 'general'
        },
        {
            id: 'application-process',
            question: 'How does the application process work?',
            answer: 'Applications are reviewed by our administration team. We look for dedicated, responsible individuals who can contribute positively to the league. You\'ll be contacted if your application is accepted.',
            category: 'applications'
        },
        {
            id: 'application-status',
            question: 'How do I know if my application was accepted?',
            answer: 'If your application is accepted, you will be contacted by our administration team through Discord or email. Please ensure your contact information is accurate in your application.',
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
            answer: 'Our game follows standard volleyball rules with some adaptations for the Roblox platform. Fair play and sportsmanship are expected from all players.',
            category: 'rules'
        },
        {
            id: 'discord-rules',
            question: 'What are the Discord server rules?',
            answer: 'Our Discord server has community guidelines that promote respect, inclusivity, and positive interaction. Violations may result in warnings or removal from the server.',
            category: 'rules'
        },
        {
            id: 'stats-tracking',
            question: 'How are player statistics tracked?',
            answer: 'Player statistics are tracked during official matches and maintained in our database. Stats include kills, assists, blocks, and other volleyball metrics.',
            category: 'technical'
        },
        {
            id: 'report-issues',
            question: 'How do I report issues or bugs?',
            answer: 'You can report issues through our Discord server, contact us page, or by reaching out to our technical team directly.',
            category: 'technical'
        },
        {
            id: 'find-awards',
            question: 'Where can I find awards and achievements?',
            answer: 'You can view all awards and achievements on our Awards page. This includes MVP awards, Best Spiker, Best Server, and other seasonal accolades.',
            category: 'navigation'
        },
        {
            id: 'find-stats',
            question: 'Where can I view player statistics?',
            answer: 'Player statistics can be found on the Stats page, which shows leaderboards and individual player performance data from matches.',
            category: 'navigation'
        },
        {
            id: 'find-games',
            question: 'Where can I see game results and schedules?',
            answer: 'Game results, schedules, and match information can be found on the Games page. This includes scores, dates, and video links when available.',
            category: 'navigation'
        },
        {
            id: 'find-teams',
            question: 'Where can I view team information?',
            answer: 'Team rosters, standings, and information can be found on the Teams page. You can also click on individual teams to see detailed team pages.',
            category: 'navigation'
        },
        {
            id: 'find-players',
            question: 'Where can I find player profiles?',
            answer: 'Player profiles and information can be found on the Players page. Click on any player to view their detailed profile, statistics, and team history.',
            category: 'navigation'
        },
        {
            id: 'find-seasons',
            question: 'Where can I see season information?',
            answer: 'Season details, themes, and information can be found on the Seasons page. This includes start/end dates and season-specific content.',
            category: 'navigation'
        },
        {
            id: 'find-articles',
            question: 'Where can I read articles and news?',
            answer: 'Articles, news, and community content can be found on the Articles page. This includes league updates, player spotlights, and other RVL content.',
            category: 'navigation'
        }
    ];

    const faqLinks: FAQLink[] = [
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
        technical: 'Technical & Support',
        navigation: 'Website Navigation'
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