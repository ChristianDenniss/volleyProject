import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useSingleArticles } from "../../hooks/allFetch";
import "../../styles/SingleArticle.css";
import { Article } from "../../types/interfaces";
import { FaHeart } from "react-icons/fa";
import SEO from "../SEO";

const SingleArticle: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <p className="sa-error">Invalid article ID.</p>;
  }

  const { data, loading, error } = useSingleArticles(id);

  // Normalize result: support both array and single object
  const article: Article | null = useMemo(() => {
    if (!data) return null;
    if (Array.isArray(data)) {
      return data.length > 0 ? data[0] : null;
    }
    return data as Article;
  }, [data]);

  return (
    <div className={`single-article-page ${loading ? 'loading' : ''}`}>
      {/* SEO Meta Tags for Social Media Embedding */}
      {article && (
        <SEO
          title={article.title}
          description={article.summary}
          image={article.imageUrl}
          url={`https://volleyball4-2.com/articles/${article.id}`}
          type="article"
          publishedTime={article.createdAt}
          author={article.author.username}
          section="News"
          tags={["volleyball", "roblox", "RVL", "gaming", "sports"]}
          structuredData={{
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": article.title,
            "description": article.summary,
            "image": article.imageUrl,
            "author": {
              "@type": "Person",
              "name": article.author.username
            },
            "publisher": {
              "@type": "Organization",
              "name": "Roblox Volleyball League",
              "logo": {
                "@type": "ImageObject",
                "url": "https://volleyball4-2.com/rvlLogo.png"
              }
            },
            "datePublished": article.createdAt,
            "dateModified": article.createdAt,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://volleyball4-2.com/articles/${article.id}`
            }
          }}
        />
      )}

      {/* Newspaper masthead */}
      <header className="np-header">
        <div className="np-header__brand">The RVL Examiner</div>
        <div className="np-header__info">
          <span className="np-header__edition">
            {loading ? 'Loading...' : `'Vol. 1, No. ${article?.id || '...'}`}
          </span>
        </div>
      </header>

      {loading ? (
        <article className="sa-article">
          <div className="sa-skeleton-image"></div>
          <div className="sa-skeleton-title"></div>
          <div className="sa-skeleton-meta"></div>
          <div className="sa-skeleton-summary"></div>
          <div className="sa-skeleton-content"></div>
          <div className="sa-skeleton-content"></div>
          <div className="sa-skeleton-content"></div>
        </article>
      ) : error ? (
        <p className="sa-error">Error: {error}</p>
      ) : !article ? (
        <p className="sa-error">No article found.</p>
      ) : (
        <article className="sa-article">
          {article.imageUrl && (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="sa-image"
            />
          )}
          <h1 className="sa-title">{article.title}</h1>
          <div className="sa-meta">
            <span className="sa-meta-author">By {article.author.username}</span>
            <span className="sa-meta-date">
              {new Date(article.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="sa-summary">{article.summary}</div>

          <div className="sa-content">{article.content}</div>
          <div className="sa-likes">
            <button
              className="sa-like-button"
              onClick={() => {
                /* handle like */
              }}
            >
              <FaHeart />
            </button>
            <span className="sa-likes-count">
              {article.likes} {article.likes === 1 ? "like" : "likes"}
            </span>
          </div>
        </article>
      )}
    </div>
  );
};

export default SingleArticle;
