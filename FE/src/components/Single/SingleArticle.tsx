import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useSingleArticles } from "../../hooks/allFetch";
import { useLikeArticle } from "../../hooks/useLikeArticle";
import { useLikeStatus } from "../../hooks/useLikeStatus";
import "../../styles/SingleArticle.css";
import { Article } from "../../types/interfaces";
import { FaHeart } from "react-icons/fa";
import SEO from "../SEO";

const page = "min-h-screen box-border [contain:layout_style_paint]";

/* The rule under the masthead was a ::after, so it stays a pseudo-element.
   EB Garamond is loaded by the remnant stylesheet this file still imports. */
const npHeader =
    "flex flex-row items-baseline justify-center gap-[1.5rem] pt-[0.5rem] px-[3rem] pb-0 " +
    "mb-0 mt-[3rem] bg-[#fdfdf9] [font-family:Georgia,serif] relative " +
    "after:content-[''] after:absolute after:bottom-0 after:left-1/2 " +
    "after:[transform:translateX(-50%)] after:w-[80%] after:h-[2px] after:bg-[#1a1a1a]";

const npBrand =
    "font-['EB_Garamond',serif] text-[3rem] tracking-[6px] uppercase font-bold text-[#1a1a1a]";

const npInfo =
    "flex flex-col items-center text-[#555] text-[1rem] leading-[1.2]";

const npEdition = "text-[1.5rem] [font-variant:small-caps] m-0 self-baseline";

const articleShell =
    "max-w-[90%] my-[1rem] mx-auto pt-0 px-[2rem] pb-[2rem] bg-[#fdfdf9] text-[#1a1a1a] " +
    "[font-family:Georgia,serif] shadow-[0_4px_12px_rgba(0,0,0,0.05)] rounded-[4px] " +
    "overflow-hidden grid grid-cols-[1fr] grid-rows-[auto_1fr_auto] relative " +
    "min-h-[600px] [content-visibility:auto] [contain-intrinsic-size:600px] " +
    "empty:before:content-[''] empty:before:block empty:before:h-[600px] empty:before:w-full";

const articleImage =
    "w-full max-h-[90vh] rounded-[4px] h-auto mt-0 mb-[0.5rem] object-cover block min-h-[300px]";

const articleTitle =
    "[font-family:Georgia,serif] text-[clamp(2rem,5vw,3rem)] uppercase tracking-[2px] " +
    "border-b-2 border-b-[#1a1a1a] pb-[0.5rem] mb-[1rem]";

/* The dots between meta items were span::before bullets, with the first span
   blanked so it does not get one. Same two elements, still pseudo-elements. */
const articleMeta =
    "flex flex-wrap gap-[1rem] [font-family:'Helvetica_Neue',Arial,sans-serif] " +
    "text-[0.9rem] text-[#555] mb-[2rem] " +
    "[&_span]:before:content-['•'] [&_span]:before:mr-[0.5rem] " +
    "[&_span:first-child]:before:content-[''] [&_span:first-child]:before:m-0";

const articleSummary =
    "block w-full mt-0 mx-[2rem] mb-[2rem] [font-family:'Helvetica_Neue',Arial,sans-serif] " +
    "text-[1.2rem] [font-variant:small-caps] text-center text-[#1a1a1a] " +
    "border-t border-t-[#1a1a1a] border-b border-b-[#1a1a1a] py-[0.5rem] px-[2rem] " +
    "break-inside-avoid";

/* The drop-cap and paragraph spacing target `p` descendants. Content is
   currently a text node, so those rules never fire - they are kept so that
   if the markup grows `<p>` tags they still look the same. */
const articleContent =
    "text-[1.1rem] leading-[1.7] columns-2 [column-gap:3rem] text-justify mb-[2rem] " +
    "upto-md:columns-1 " +
    "[&_p]:mb-[1.5rem] " +
    "[&_p:first-of-type]:first-letter:text-[4rem] [&_p:first-of-type]:first-letter:float-left " +
    "[&_p:first-of-type]:first-letter:leading-none " +
    "[&_p:first-of-type]:first-letter:mt-[0.1rem] [&_p:first-of-type]:first-letter:mr-[0.5rem] " +
    "[&_p:first-of-type]:first-letter:mb-0 [&_p:first-of-type]:first-letter:ml-0 " +
    "[&_p:first-of-type]:first-letter:font-bold [&_p:first-of-type]:first-letter:text-[#800000]";

const likesRow =
    "flex items-center gap-[0.5rem] mt-[2rem] [font-family:'Helvetica_Neue',Arial,sans-serif]";

const likesCountBase =
    "text-[1rem] transition-[color] duration-300 ease-[ease]";

const statusMessage =
    "text-center p-[2rem] [font-family:'Helvetica_Neue',Arial,sans-serif] text-[#555]";

const skeletonSweep =
    "bg-[linear-gradient(90deg,#f0f0f0_25%,#e0e0e0_50%,#f0f0f0_75%)] bg-[length:200%_100%] " +
    "animate-skeleton-sweep";

/* Liked / liking / idle used to be extra classes the stylesheet read. The
   same three states now pick their colour and animation directly. Hover
   writes `transform` as one value because the original animates transform. */
function likeButtonClasses(liked: boolean, liking: boolean) {
    const base =
        "[background:none] border-none cursor-pointer text-[2rem] p-0 leading-none " +
        "transition-all duration-300 ease-[ease] relative " +
        "disabled:cursor-not-allowed disabled:opacity-60";

    if (liking) {
        return `${base} animate-liking text-[#800000]`;
    }
    if (liked) {
        return (
            `${base} text-[#d32f2f] animate-like ` +
            "hover:enabled:text-[#b71c1c] hover:enabled:[transform:scale(1.1)]"
        );
    }
    return (
        `${base} text-[#e0e0e0] ` +
        "hover:enabled:text-[#d32f2f] hover:enabled:[transform:scale(1.1)]"
    );
}

const SingleArticle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toggleLike, isLiking, error: likeError } = useLikeArticle();
  const [localLikeCount, setLocalLikeCount] = useState<number | null>(null);

  if (!id) {
    return <p className={statusMessage}>Invalid article ID.</p>;
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

  return (
    <div className={`${page} ${loading ? "opacity-80 pointer-events-none" : ""}`}>
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
      <header className={npHeader}>
        <div className={npBrand}>The RVL Examiner</div>
        <div className={npInfo}>
          <span className={npEdition}>
            {loading ? 'Loading...' : `'Vol. 1, No. ${article?.id || '...'}`}
          </span>
        </div>
      </header>

      {loading ? (
        <article className={articleShell}>
          <div className={`${skeletonSweep} rounded-[4px] h-[300px] w-full mb-[0.5rem]`}></div>
          <div className={`${skeletonSweep} h-[60px] w-[80%] mb-[1rem] rounded-[4px]`}></div>
          <div className={`${skeletonSweep} h-[20px] w-[60%] mb-[2rem] rounded-[4px]`}></div>
          <div className={`${skeletonSweep} h-[40px] w-full mb-[2rem] rounded-[4px]`}></div>
          <div className={`${skeletonSweep} h-[20px] w-full mb-[1rem] rounded-[4px]`}></div>
          <div className={`${skeletonSweep} h-[20px] w-[90%] mb-[1rem] rounded-[4px]`}></div>
          <div className={`${skeletonSweep} h-[20px] w-[95%] mb-[1rem] rounded-[4px]`}></div>
        </article>
      ) : error ? (
        <p className={statusMessage}>Error: {error}</p>
      ) : !article ? (
        <p className={statusMessage}>No article found.</p>
      ) : (
        <article className={articleShell}>
          {article.imageUrl && (
            <img
              src={article.imageUrl}
              alt={article.title}
              className={articleImage}
            />
          )}
          <h1 className={articleTitle}>{article.title}</h1>
          <div className={articleMeta}>
            <span>By {article.author.username}</span>
            <span>
              {new Date(article.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className={articleSummary}>{article.summary}</div>

          <div className={articleContent}>{article.content}</div>
          
          {likeError && (
            <div className={statusMessage} style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'rgba(255, 0, 0, 0.1)', borderRadius: '4px' }}>
              {likeError}
            </div>
          )}
          
          <div className={likesRow}>
            <button
              className={likeButtonClasses(hasLiked, isLiking)}
              onClick={handleToggleLike}
              disabled={isLiking || likeStatusLoading}
              title={isLiking ? 'Processing...' : hasLiked ? 'Unlike this article' : 'Like this article'}
            >
              {likeStatusLoading ? (
                <div className="animate-like-loading opacity-70">❤️</div>
              ) : (
                <HeartIcon />
              )}
            </button>
            {/* Colour used to come from `.sa-like-button.liked + .sa-likes-count`.
                The liked flag is already in React, so the count reads it directly. */}
            <span className={`${likesCountBase} ${hasLiked ? "text-[#800000]" : "text-[#1a1a1a]"}`}>
              {displayLikeCount} {displayLikeCount === 1 ? "like" : "likes"}
            </span>
          </div>
        </article>
      )}
    </div>
  );
};

export default SingleArticle;
