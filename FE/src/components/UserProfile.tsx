// src/pages/Profile.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { authFetch } from "../hooks/authFetch";
import { useAuth } from "../context/authContext";
import { BACKEND_URL } from "../constants/api";
import { startRobloxOAuth } from "../hooks/useTeamRegistrations";

const profileContainer =
    "grid [grid-template-areas:'header_header'_'card_articles'] grid-cols-[1fr_1fr] " +
    "gap-x-[2rem] w-[90%] my-[2rem] mx-auto p-[2rem] bg-bg rounded-lg shadow-md " +
    "[font-family:'Inter',sans-serif] text-text " +
    "upto-800:[grid-template-areas:'header'_'card'_'articles'] upto-800:grid-cols-[1fr]";

const profileStatus =
    `${profileContainer} col-span-full text-center text-[1rem] text-error py-[2rem] px-0`;

const profileTitle =
    "[grid-area:header] text-[2.25rem] font-bold text-brand-primary mt-0 mx-0 mb-[2rem] text-center";

const profileCard =
    "[grid-area:card] pt-0 pr-[1rem] pb-[1rem] pl-0 border-r border-solid border-border " +
    "before:content-['Details'] before:block before:text-[1.5rem] before:font-semibold " +
    "before:text-brand-primary before:mb-[3rem] before:ml-[11rem] before:text-left " +
    "upto-800:border-r-0 upto-800:border-b upto-800:border-solid upto-800:border-border " +
    "upto-800:pb-[1rem] upto-800:before:ml-0 upto-800:before:text-center";

const profileRow =
    "flex items-center mt-0 mx-[2rem] mb-[1rem] text-[1rem] leading-[1.6] justify-start text-text-muted";

const profileLabel = "w-[200px] shrink-0 font-semibold text-text mr-[0.5rem]";

const profileArticles =
    "[grid-area:articles] pl-[1rem] upto-800:pl-0 upto-800:mt-[2rem]";

const articlesHeading =
    "text-[1.5rem] font-semibold text-brand-primary mt-0 mx-0 mb-[1rem] text-center";

const articlesList = "list-none p-0 m-0";

const articleItem =
    "bg-accent-pale border border-solid border-accent-border rounded-md py-[0.75rem] px-[1rem] " +
    "mb-[1rem] shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-[ease] " +
    "flex justify-start text-left hover:[transform:translateY(-3px)] hover:shadow-md " +
    "hover:border-brand-primary";

const articleLink =
    "no-underline text-text font-medium text-[0.95rem] hover:text-brand-primary";

const emptyArticles = "text-center my-[1rem] mx-0 text-text-muted";

interface Article {
    id:      number;
    title:   string;
    approved: boolean;
}

interface UserProfile {
    id:        number;
    username:  string;
    email:     string | null;
    role:      string;
    createdAt: string;
    updatedAt: string;
    robloxUsername?: string | null;
    robloxUserId?: string | null;
    hasPassword?: boolean;
    articles?: Article[];
}

const ProfilePage: React.FC = () =>
{
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isAuthenticated, loading: authLoading, logout, token } = useAuth();
    const navigate = useNavigate();

    useEffect(() =>
    {
        if (authLoading)
        {
            return;
        }

        if (!isAuthenticated)
        {
            navigate("/login");
            return;
        }

        const fetchProfile = async () =>
        {
            setLoading(true);
            setError(null);

            try
            {
                const res = await authFetch(
                    `${BACKEND_URL}/api/users/profile`,
                    { method: "GET" },
                    token
                );

                if (res.status === 401)
                {
                    logout();
                    navigate("/login");
                    return;
                }

                const data = await res.json();

                if (!res.ok)
                {
                    throw new Error(data.error || "Failed to load profile");
                }

                console.log('Profile data received:', data);
                console.log('Articles data:', data.articles);
                setProfile(data);
            }
            catch (err: any)
            {
                setError(err.message);
            }
            finally
            {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [authLoading, isAuthenticated, navigate, logout, token]);

    // show spinner while auth or data is loading
    if (authLoading || loading)
    {
        return <div className={profileStatus}>Loading...</div>;
    }

    if (error)
    {
        return <div className={profileStatus}>{error}</div>;
    }

    if (!profile)
    {
        return null;
    }

    const articles = profile.articles ?? [];

    return (
        <div className={profileContainer}>
            <h2 className={profileTitle}>Your Account</h2>

            <div className={profileCard}>
                <p className={profileRow}><strong className={profileLabel}>Username:</strong> {profile.username}</p>
                <p className={profileRow}><strong className={profileLabel}>Email:</strong>    {profile.email || "—"}</p>
                <p className={profileRow}>
                    <strong className={profileLabel}>Role / Permissions level:</strong>{" "}
                    {profile.role}
                </p>
                <p className={profileRow}>
                    <strong className={profileLabel}>Roblox:</strong>{" "}
                    {profile.robloxUsername ? `@${profile.robloxUsername}` : "Not connected"}
                </p>
                <div className="mt-[0.5rem] mx-0 mb-[1rem]">
                    {!profile.robloxUsername ? (
                        <button type="button" onClick={() => void startRobloxOAuth("connect")}>
                            Connect Roblox
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={async () => {
                                const res = await authFetch(
                                    `${BACKEND_URL}/api/auth/roblox/unlink`,
                                    { method: "POST" },
                                    token
                                );
                                if (res.ok) {
                                    const data = await res.json();
                                    setProfile((p) => (p ? { ...p, ...data } : p));
                                } else {
                                    const data = await res.json().catch(() => ({}));
                                    alert(data.error || "Failed to unlink");
                                }
                            }}
                        >
                            Disconnect Roblox
                        </button>
                    )}
                </div>
                <p className={profileRow}>
                    <strong className={profileLabel}>Join Date:</strong>{" "}
                    {new Date(profile.createdAt).toLocaleDateString()}
                </p>
                <p className={profileRow}>
                    <strong className={profileLabel}>Last Updated:</strong>{" "}
                    {new Date(profile.updatedAt).toLocaleDateString()}
                </p>
            </div>

            <div className={profileArticles}>
                <h3 className={articlesHeading}>Your Articles</h3>
                {articles.length > 0 ? (
                    <ul className={articlesList}>
                        {articles.map(article => (
                            <li key={article.id} className={articleItem}>
                                <Link to={`/articles/${article.id}`} className={articleLink}>
                                    {article.title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className={emptyArticles}>You have not created any articles yet.</p>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
