// src/pages/Profile.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { authFetch } from "../hooks/authFetch";
import { useAuth } from "../context/authContext";
import "../styles/UserProfile.css";

interface Article {
    id:      number;
    title:   string;
    approved: boolean;
}

interface UserProfile {
    id:        number;
    username:  string;
    email:     string;
    role:      string;
    createdAt: string;
    updatedAt: string;
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
                    `${import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"}/api/users/profile`,
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
        return <div className="profile-container loading">Loading...</div>;
    }

    if (error)
    {
        return <div className="profile-container error">{error}</div>;
    }

    if (!profile)
    {
        return null;
    }

    const articles = profile.articles ?? [];

    return (
        <div className="profile-container">
            <h2>Your Account</h2>

            <div className="profile-card">
                <p><strong>Username:</strong> {profile.username}</p>
                <p><strong>Email:</strong>    {profile.email}</p>
                <p>
                    <strong>Role / Permissions level:</strong>{" "}
                    {profile.role}
                </p>
                <p>
                    <strong>Join Date:</strong>{" "}
                    {new Date(profile.createdAt).toLocaleDateString()}
                </p>
                <p>
                    <strong>Last Updated:</strong>{" "}
                    {new Date(profile.updatedAt).toLocaleDateString()}
                </p>
            </div>

            <div className="profile-articles">
                <h3>Your Articles</h3>
                {articles.length > 0 ? (
                    <ul>
                        {articles.map(article => (
                            <li key={article.id}>
                                <Link to={`/articles/${article.id}`}>
                                    {article.title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>You have not created any articles yet.</p>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
