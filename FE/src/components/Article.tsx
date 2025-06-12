// src/components/Articles.tsx

import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useArticles } from "../hooks/allFetch";
import { useAuth } from "../context/authContext";
import type { Article } from "../types/interfaces";
import "../styles/Article.css";

const Articles: React.FC = () =>
{
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    
    // State for search term
    const [ searchTerm, setSearchTerm ] = useState<string>("");

    // State for sort order: "new" or "old"
    const [ sortOrder, setSortOrder ] = useState<"new" | "old">("new");

    // State for auth message
    const [showAuthMessage, setShowAuthMessage] = useState<boolean>(false);

    // Use custom hook to get articles data
    const { data, error } = useArticles();

    const handleCreateClick = (e: React.MouseEvent) => {
        if (!isAuthenticated) {
            e.preventDefault();
            setShowAuthMessage(true);
            // Hide message after 3 seconds
            setTimeout(() => setShowAuthMessage(false), 3000);
            return;
        }

        // Check if user has appropriate role
        if (user && (user.role === 'user' || user.role === 'admin' || user.role === 'superadmin')) {
            navigate('/articles/create');
        } else {
            e.preventDefault();
            setShowAuthMessage(true);
            setTimeout(() => setShowAuthMessage(false), 3000);
        }
    };

    // Compute filtered and sorted articles
    const filteredAndSorted = useMemo(() =>
    {
        if (!data)
        {
            return [];
        }

        // Filter by title (case-insensitive)
        const filtered = data.filter((article: Article) =>
            article.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Sort by createdAt
        const sorted = filtered.sort((a: Article, b: Article) =>
        {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();

            if (sortOrder === "new")
            {
                return dateB - dateA;
            }
            else // "old"
            {
                return dateA - dateB;
            }
        });

        return sorted;
    }, [ data, searchTerm, sortOrder ]);

    // Total number of articles
    const totalCount = data ? data.length : 0;

    return (
        <div className="articles-container">
            <h1>Articles</h1>

            {showAuthMessage && (
                <div className="auth-message">
                    {!isAuthenticated 
                        ? "Please log in to create articles!"
                        : "You need to be a registered user, admin, or superadmin to create articles!"}
                </div>
            )}

            {/* Create Article button */}
            <div className="create-article-section">
                <Link 
                    to="/articles/create" 
                    className="create-article-btn"
                    onClick={handleCreateClick}
                >
                    Create Article
                </Link>
            </div>

            <div className="articles-controls">
                {/* Total count */}
                <div className="articles-count">
                    Total: { totalCount } articles
                </div>

                {/* Search bar */}
                <input
                    type="text"
                    className="articles-search"
                    placeholder="Search by title..."
                    value={ searchTerm }
                    onChange={ (e) => setSearchTerm(e.target.value) }
                />

                {/* Sort select */}
                <select
                    className="articles-sort"
                    value={ sortOrder }
                    onChange={ (e) =>
                    {
                        setSortOrder(e.target.value as "new" | "old");
                    } }
                >
                    <option value="new">Newest</option>
                    <option value="old">Oldest</option>
                </select>
            </div>

            {
                error
                ? (
                    <div>Error: { error }</div>
                )
                : data
                ? (
                    <div className="articles-list">
                        { filteredAndSorted.map((article: Article) =>
                        {
                            return (
                                <Link
                                    to={`/articles/${ article.id }`}
                                    key={ article.id }
                                    className="article-item"
                                >
                                    <div className="article-card">
                                        <img
                                            src={ article.imageUrl }
                                            alt={ article.title }
                                            className="article-image"
                                        />
                                        <h2>{ article.title }</h2>
                                        <p>{ article.summary }</p>
                                    </div>
                                </Link>
                            );
                        }) }
                    </div>
                )
                : (
                    <div>Loading...</div>
                )
            }
        </div>
    );
};

export default Articles;
