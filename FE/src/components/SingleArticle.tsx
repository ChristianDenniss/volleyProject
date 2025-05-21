import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useSingleArticles } from "../hooks/allFetch";
import "../styles/SingleArticle.css";
import { Article } from "../types/interfaces";
import { FaHeart } from "react-icons/fa";

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

  if (loading) {
    return <p className="sa-loading">Loading article...</p>;
  }
  if (error) {
    return <p className="sa-error">Error: {error}</p>;
  }
  if (!article) {
    return <p className="sa-error">No article found.</p>;
  }

  return (
    <>
      {/* Newspaper masthead */}
      <header className="np-header">
        <div className="np-header__brand">The RVL Examiner</div>
        <div className="np-header__info">
          <span className="np-header__edition">'Vol. 1, No. {article.id}</span>
        </div>
      </header>

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
    </>
  );
};

export default SingleArticle;
