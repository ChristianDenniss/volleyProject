import React, { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import "../styles/Home.css";
import promoImg from "../images/callToAction.png";
import { useArticles } from "../hooks/allFetch";

const Home: React.FC = () => {
    const playerRef = useRef<any>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);

    // Fetch real articles
    const { data: articles = [], loading, error } = useArticles();

    // Sort by ID descending
    const sortedById = useMemo(() => {
        return Array.isArray(articles) ? [...articles].sort((a, b) => b.id - a.id) : [];
    }, [articles]);

    // Highest ID = featured
    const featuredArticle = useMemo(() => {
        return sortedById.length > 0 ? sortedById[0] : null;
    }, [sortedById]);

    // Next four IDs = side articles
    const sideArticles = useMemo(() => {
        return sortedById.slice(1, 5);
    }, [sortedById]);

    // Load YouTube IFrame API and initialize player
    useEffect(() => {
        const createPlayer = () => {
            const YT = (window as any).YT;
            if (!YT?.Player) {
                console.error("YT or YT.Player missing");
                return;
            }
            playerRef.current = new YT.Player("yt-player", {
                videoId: "jUYJKjPvPoQ",
                playerVars: {
                    modestbranding: 1,
                    rel: 0,
                    controls: 1,
                    showinfo: 0,
                    autoplay: 0,
                    mute: 1,
                },
                events: {
                    onReady: () => {
                        setIsPlayerReady(true);
                    },
                },
            });
        };

        if (!document.getElementById("youtube-iframe-api")) {
            const tag = document.createElement("script");
            tag.id = "youtube-iframe-api";
            tag.src = "https://www.youtube.com/iframe_api";
            document.body.appendChild(tag);
            (window as any).onYouTubeIframeAPIReady = createPlayer;
        } else if ((window as any).YT?.Player) {
            createPlayer();
        } else {
            (window as any).onYouTubeIframeAPIReady = createPlayer;
        }

        return () => {
            delete (window as any).onYouTubeIframeAPIReady;
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
                setIsPlayerReady(false);
            }
        };
    }, []);

    // Intersection Observer to play/pause video when in viewport
    useEffect(() => {
        if (!videoContainerRef.current || !isPlayerReady || !playerRef.current) {
            return;
        }
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
                        playerRef.current.playVideo();
                    } else {
                        playerRef.current.pauseVideo();
                    }
                });
            },
            { threshold: [0, 0.6, 1] }
        );
        observer.observe(videoContainerRef.current);
        return () => observer.disconnect();
    }, [isPlayerReady]);

    return (
        <div style={{ overflowX: "hidden" }}>
            <main className="home">
                <section className="headline-section">
                    {featuredArticle && (
                        <Link to={`/articles/${featuredArticle.id}`}>  {/* wrap featured */}
                            <div className="featured-article">
                                {loading && <p>Loading featured…</p>}
                                {error && <p>Error: {error}</p>}
                                {!loading && !error && (
                                    <>
                                        <img
                                            src={featuredArticle.imageUrl}
                                            alt={featuredArticle.title}
                                            className="featured-image"
                                        />
                                        <div className="featured-text">
                                            <span className="tag">
                                                By {featuredArticle.author.username}
                                            </span>
                                            <span className="date-tag">
                                                {new Date(
                                                    featuredArticle.createdAt
                                                ).toLocaleDateString()}
                                            </span>
                                            <h2>{featuredArticle.title}</h2>
                                            <p>{featuredArticle.summary}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </Link>
                    )}

                    <aside className="side-articles">
                        {loading && <p>Loading articles…</p>}
                        {error && <p>Error loading articles: {error}</p>}
                        {!loading && !error && sideArticles.map(article => (
                            <Link
                                key={article.id}
                                to={`/articles/${article.id}`}  /* wrap each side article */
                            >
                                <article>
                                    <h4>{article.title}</h4>
                                    {article.imageUrl && (
                                        <img src={article.imageUrl} alt={article.title} />
                                    )}
                                </article>
                            </Link>
                        ))}
                        {!loading && !error && sideArticles.length === 0 && (
                            <p>No recent articles.</p>
                        )}
                    </aside>
                </section>

                <section
                    className="video-section"
                    ref={videoContainerRef}
                    aria-label="Volleyball promotional video"
                >
                    <div id="yt-player" className="yt-player" />
                </section>

                <section className="call-to-action">
                    <img
                        src={promoImg}
                        alt="Volleyball App Promo"
                        className="promo-banner"
                    />
                    <div className="cta-text">
                        <button
                            className="join-button"
                            onClick={() => alert("Join RVL Today!")}
                        >
                            Join RVL Today
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Home;
