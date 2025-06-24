import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useSingleArticles } from "../../hooks/allFetch";
import { useLikeArticle } from "../../hooks/useLikeArticle";
import { useLikeStatus } from "../../hooks/useLikeStatus";
import "../../styles/SingleArticle.css";
import { Article } from "../../types/interfaces";
import { FaHeart } from "react-icons/fa";
import SEO from "../SEO";

const SingleArticle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toggleLike, isLiking, error: likeError } = useLikeArticle();
  const [localLikeCount, setLocalLikeCount] = useState<number | null>(null);

  if (!id) {
    return <p className="sa-error">Invalid article ID.</p>;
  }

  const { data, loading, error } = useSingleArticles(id);
  const { hasLiked, loading: likeStatusLoading, refetch: refetchLikeStatus } = useLikeStatus(parseInt(id));

  // Normalize result: support both array and single object
  const article: Article | null = useMemo(() => {
    if (!data) return null;
    if (Array.isArray(data)) {
      return data.length > 0 ? data[0] : null;
    }
    return data as Article;
  }, [data]);

  // Use local like count if available, otherwise use article likes
  const displayLikeCount = localLikeCount !== null ? localLikeCount : (article?.likes || 0);

  const handleToggleLike = async () => {
    if (article) {
      console.log('Toggle like called:', { articleId: article.id, hasLiked, displayLikeCount });
      const success = await toggleLike(article.id, hasLiked);
      console.log('Toggle like result:', success);
      
      // Only update local like count if the API call was successful
      if (success) {
        if (hasLiked) {
          setLocalLikeCount(Math.max(displayLikeCount - 1, 0));
        } else {
          setLocalLikeCount(displayLikeCount + 1);
        }
        // Refetch like status to update the heart icon
        refetchLikeStatus();
      }
    }
  };

  // Determine which heart icon to show
  const HeartIcon = FaHeart;
  const heartClass = hasLiked ? 'liked' : '';

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
          
          {likeError && (
            <div className="sa-error" style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'rgba(255, 0, 0, 0.1)', borderRadius: '4px' }}>
              {likeError}
            </div>
          )}
          
          <div className="sa-likes">
            <button
              className={`sa-like-button ${heartClass} ${isLiking ? 'liking' : ''}`}
              onClick={handleToggleLike}
              disabled={isLiking || likeStatusLoading}
              title={isLiking ? 'Processing...' : hasLiked ? 'Unlike this article' : 'Like this article'}
            >
              {likeStatusLoading ? (
                <div className="sa-like-loading">❤️</div>
              ) : (
                <HeartIcon />
              )}
            </button>
            <span className="sa-likes-count">
              {displayLikeCount} {displayLikeCount === 1 ? "like" : "likes"}
            </span>
          </div>
        </article>
      )}
    </div>
  );
};

export default SingleArticle;
