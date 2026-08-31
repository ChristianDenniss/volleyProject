// src/components/Articles.tsx

import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useArticles } from "../hooks/allFetch";
import { useAuth } from "../context/authContext";
import type { Article } from "../types/interfaces";
import SEO from "./SEO";

const skeletonSweep =
    "bg-[linear-gradient(90deg,#f0f0f0_25%,#e0e0e0_50%,#f0f0f0_75%)] bg-size-[200%_100%] animate-skeleton-sweep";

const listContainer =
    "p-[16px] min-h-[100vh] [contain:layout_style] [content-visibility:auto] upto-md:min-h-[80vh]";

const listContainerLoading = `${listContainer} opacity-80 pointer-events-none`;

const createSection = "mb-[20px] flex justify-end min-h-[2.5rem]";

const controls =
    "flex flex-wrap items-center gap-[12px] mb-[16px] min-h-[3rem]";

const createBtn =
    "bg-brand-primary text-white border-none rounded-sm no-underline font-medium " +
    "transition-colors duration-200 ease-in-out w-[140px] h-[40px] inline-flex items-center " +
    "justify-center box-border [will-change:background-color] [transform:translateZ(0)] " +
    "[backface-visibility:hidden] [contain:layout_style] hover:bg-brand-primary-hover";

const authMessage =
    "bg-[#fff3cd] text-[#856404] p-[12px] rounded-sm mb-[16px] border border-solid " +
    "border-[#ffeeba] animate-article-fade-in min-h-[2rem]";

const count = "font-bold min-h-[1.5rem] min-w-[120px]";

const search =
    "p-[8px] border border-solid border-[#ccc] rounded-sm flex-1 min-w-[200px] min-h-[1.5rem]";

const sort =
    "p-[8px] border border-solid border-[#ccc] rounded-sm min-h-[2rem] min-w-[100px]";

const sortIndicator =
    "bg-brand-primary text-white py-[4px] px-[12px] rounded-[20px] text-[0.75rem] " +
    "font-semibold animate-article-pulse shadow-[0_2px_8px_rgba(45,60,80,0.3)]";

const grid =
    "grid grid-cols-[1fr] gap-[16px] min-h-[600px] [contain:layout_style] " +
    "md:grid-cols-[repeat(2,1fr)] md:min-h-[500px] upto-md:min-h-[400px]";

const item = "no-underline text-inherit min-h-[350px] upto-md:min-h-[300px]";

const card =
    "border border-solid border-[#ddd] rounded-md overflow-hidden flex flex-col bg-white " +
    "transition-[box-shadow] duration-200 ease-in-out min-h-[350px] [will-change:box-shadow] " +
    "[transform:translateZ(0)] [backface-visibility:hidden] [contain:layout_style] " +
    "hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)] upto-md:min-h-[300px]";

const image =
    "w-full h-[250px] object-cover min-h-[250px] [contain:layout_style]";

const cardTitle = "mt-[12px] mx-[16px] mb-[8px] text-[1.25rem] min-h-[2rem]";

const cardSummary = "mt-0 mx-[16px] mb-[16px] text-[1rem] text-[#555] min-h-[3rem]";

const meta =
    "flex justify-between items-center pt-0 px-[16px] pb-[16px] mt-auto text-[0.875rem] text-[#666]";

const likes = "flex items-center gap-[4px] font-medium hover:text-[#d32f2f]";

const date = "text-[#888] italic";

const skeletonTitle = `${skeletonSweep} rounded-md h-[2rem] w-[200px] mb-[20px] upto-md:w-[150px]`;
const skeletonCreateBtn = `${skeletonSweep} rounded-sm h-[2rem] w-[120px]`;
const skeletonCount = `${skeletonSweep} rounded-sm h-[1.5rem] w-[120px]`;
const skeletonSearch = `${skeletonSweep} rounded-sm h-[2rem] flex-1 min-w-[200px] upto-md:min-w-[150px]`;
const skeletonSort = `${skeletonSweep} rounded-sm h-[2rem] w-[100px]`;
const skeletonCard =
    "border border-solid border-[#ddd] rounded-md overflow-hidden flex flex-col bg-white min-h-[350px]";
const skeletonImage = `${skeletonSweep} h-[250px] w-full`;
const skeletonCardTitle = `${skeletonSweep} rounded-sm h-[2rem] mt-[12px] mx-[16px] mb-[8px] w-[80%]`;
const skeletonCardSummary = `${skeletonSweep} rounded-sm h-[3rem] mt-0 mx-[16px] mb-[16px] w-[90%]`;

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
            <div className={listContainerLoading}>
                <div className={skeletonTitle}></div>
                
                <div className={createSection}>
                    <div className={skeletonCreateBtn}></div>
                </div>
                
                <div className={controls}>
                    <div className={skeletonCount}></div>
                    <div className={skeletonSearch}></div>
                    <div className={skeletonSort}></div>
                </div>
                
                <div className={grid}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className={skeletonCard}>
                            <div className={skeletonImage}></div>
                            <div className={skeletonCardTitle}></div>
                            <div className={skeletonCardSummary}></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={listContainer}>
            <SEO
                title="Articles"
                description="News, recaps, and community writing from the Roblox Volleyball League."
                url="https://volleyball4-2.com/articles"
            />
            {showAuthMessage && (
                <div className={authMessage}>
                    {!isAuthenticated 
                        ? "Please log in to create articles!"
                        : "You need to be a registered user, admin, or superadmin to create articles!"}
                </div>
            )}

            {/* Create Article button */}
            <div className={createSection}>
                <Link 
                    to="/articles/create" 
                    className={createBtn}
                    onClick={handleCreateClick}
                >
                    Create Article
                </Link>
            </div>

            <div className={controls}>
                {/* Total count */}
                <div className={count}>
                    Total: { totalCount } articles
                </div>

                {/* Search bar */}
                <input
                    type="text"
                    className={search}
                    placeholder="Search by title..."
                    value={ searchTerm }
                    onChange={ (e) => setSearchTerm(e.target.value) }
                />

                {/* Sort select */}
                <select
                    className={sort}
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
                    <div className={sortIndicator}>
                        🔥 Most Popular
                    </div>
                )}
                {sortOrder === "least-likes" && (
                    <div className={sortIndicator}>
                        💡 Hidden Gems
                    </div>
                )}
            </div>

            {error ? (
                <div>Error: { error }</div>
            ) : data ? (
                <div className={grid}>
                    { filteredAndSorted.map((article: Article) =>
                    {
                        return (
                            <Link
                                to={`/articles/${ article.id }`}
                                key={ article.id }
                                className={item}
                            >
                                <div className={card}>
                                    <img
                                        src={ article.imageUrl }
                                        alt={ article.title }
                                        className={image}
                                    />
                                    <h2 className={cardTitle}>{ article.title }</h2>
                                    <p className={cardSummary}>{ article.summary }</p>
                                    <div className={meta}>
                                        <span className={likes}>
                                            ❤️ {article.likes || 0} likes
                                        </span>
                                        <span className={date}>
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
