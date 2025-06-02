// src/components/Articles.tsx

import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useArticles } from "../hooks/allFetch";
import type { Article } from "../types/interfaces";
import "../styles/Article.css";

const Articles: React.FC = () =>
{
    // State for search term
    const [ searchTerm, setSearchTerm ] = useState<string>("");

    // State for sort order: "new" or "old"
    const [ sortOrder, setSortOrder ] = useState<"new" | "old">("new");

    // Use custom hook to get articles data
    const { data, error } = useArticles();

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

            {/*
                Controls: display total count, search input, sort select
            */}
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
