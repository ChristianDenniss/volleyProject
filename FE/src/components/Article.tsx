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

    // State for sort order: "new", "old", "likes", or "least-likes"
    const [ sortOrder, setSortOrder ] = useState<"new" | "old" | "likes" | "least-likes">("new");

    // State for auth message
    const [showAuthMessage, setShowAuthMessage] = useState<boolean>(false);

    // Use custom hook to get articles data
    const { data, error, loading } = useArticles();

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

        // Filter by title (case-insensitive) and approved status
        const filtered = data.filter((article: Article) =>
            article.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
            article.approved === true
        );

        // Sort by createdAt or likes
        const sorted = filtered.sort((a: Article, b: Article) =>
        {
            if (sortOrder === "new")
            {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return dateB - dateA;
            }
            else if (sortOrder === "likes")
            {
                return (b.likes || 0) - (a.likes || 0);
            }
            else if (sortOrder === "least-likes")
            {
                return (a.likes || 0) - (b.likes || 0);
            }
            else // "old"
            {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return dateA - dateB;
            }
        });

        return sorted;
    }, [ data, searchTerm, sortOrder ]);

    // Total number of approved articles
    const totalCount = data ? data.filter(article => article.approved === true).length : 0;

    // Loading state with skeleton
    if (loading) {
        return (
            <div className="article-list-container loading">
                <div className="skeleton-title"></div>
                
                <div className="article-list-create-section">
                    <div className="skeleton-create-btn"></div>
                </div>
                
                <div className="article-list-controls">
                    <div className="skeleton-count"></div>
                    <div className="skeleton-search"></div>
                    <div className="skeleton-sort"></div>
                </div>
                
                <div className="article-list-grid">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="skeleton-article-card">
                            <div className="skeleton-article-image"></div>
                            <div className="skeleton-article-title"></div>
                            <div className="skeleton-article-summary"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="article-list-container">
            <h1>Articles</h1>

            {showAuthMessage && (
                <div className="article-list-auth-message">
                    {!isAuthenticated 
                        ? "Please log in to create articles!"
                        : "You need to be a registered user, admin, or superadmin to create articles!"}
                </div>
            )}

            {/* Create Article button */}
            <div className="article-list-create-section">
                <Link 
                    to="/articles/create" 
                    className="article-create-btn"
                    onClick={handleCreateClick}
                >
                    Create Article
                </Link>
            </div>

            <div className="article-list-controls">
                {/* Total count */}
                <div className="article-list-count">
                    Total: { totalCount } articles
                </div>

                {/* Search bar */}
                <input
                    type="text"
                    className="article-list-search"
                    placeholder="Search by title..."
                    value={ searchTerm }
                    onChange={ (e) => setSearchTerm(e.target.value) }
                />

                {/* Sort select */}
                <select
                    className="article-list-sort"
                    value={ sortOrder }
                    onChange={ (e) =>
                    {
                        setSortOrder(e.target.value as "new" | "old" | "likes" | "least-likes");
                    } }
                >
                    <option value="new">Newest</option>
                    <option value="old">Oldest</option>
                    <option value="likes">Most Liked</option>
                    <option value="least-likes">Least Liked</option>
                </select>

                {/* Sort indicator */}
                {sortOrder === "likes" && (
                    <div className="article-list-sort-indicator">
                        🔥 Most Popular
                    </div>
                )}
                {sortOrder === "least-likes" && (
                    <div className="article-list-sort-indicator">
                        💡 Hidden Gems
                    </div>
                )}
            </div>

            {error ? (
                <div>Error: { error }</div>
            ) : data ? (
                <div className="article-list-grid">
                    { filteredAndSorted.map((article: Article) =>
                    {
                        return (
                            <Link
                                to={`/articles/${ article.id }`}
                                key={ article.id }
                                className="article-list-item"
                            >
                                <div className="article-list-card">
                                    <img
                                        src={ article.imageUrl }
                                        alt={ article.title }
                                        className="article-list-image"
                                    />
                                    <h2>{ article.title }</h2>
                                    <p>{ article.summary }</p>
                                    <div className="article-list-meta">
                                        <span className="article-list-likes">
                                            ❤️ {article.likes || 0} likes
                                        </span>
                                        <span className="article-list-date">
                                            {new Date(article.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    }) }
                </div>
            ) : (
                <div>No articles found.</div>
            )}
        </div>
    );
};

export default Articles;
