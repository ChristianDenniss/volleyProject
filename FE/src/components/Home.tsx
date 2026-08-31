import React, { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import "../styles/Home.css";
import promoImg from "../images/callToAction.png";
import { useArticles } from "../hooks/allFetch";
import SEO from "./SEO";
import {
    getVisualViewportWidth,
    subscribeVisualViewport,
    VIEWPORT_COMPACT_MAX,
    VIEWPORT_HOME_LARGE_MIN,
} from "../utils/visualViewport";

const MAX_SIDE_ARTICLES = 5;
const DEFAULT_SIDE_ARTICLE_COUNT = 4;
const LARGE_SIDE_ARTICLE_COUNT = 5;
const SIDE_ARTICLE_MIN_HEIGHT = 80;
const SIDE_ARTICLE_GAP = 16;

/* The CTA button. The three narrow-screen cases are not redundant: upto-md and
   upto-xs are width media queries, while vp-mobile keys off the data-viewport
   attribute the app sets from the visual viewport, so it also fires when the
   page is zoomed rather than merely narrow. It carries higher specificity than
   a media query, which is what let it win before and what lets it win now. */
const joinButton =
    "bg-[#edbb00] text-black border-none px-[1.5rem] py-[0.6rem] text-[1.1rem] " +
    "font-bold rounded-[6px] cursor-pointer " +
    "transition-[background-color] duration-300 ease-[ease] hover:bg-[#c49a00] " +
    "upto-md:text-[1rem] upto-md:px-[1.2rem] upto-md:py-[0.5rem] " +
    "upto-xs:text-[0.9rem] upto-xs:px-[1rem] upto-xs:py-[0.4rem] " +
    "vp-mobile:text-[1rem] vp-mobile:px-[1.2rem] vp-mobile:py-[0.5rem] " +
    "coarse:cursor-default coarse:active:bg-[#c49a00]";

const Home: React.FC = () => {
    const playerRef = useRef<any>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const featuredRef = useRef<HTMLDivElement>(null);
    const headlineSectionRef = useRef<HTMLElement>(null);
    const sideArticlesRef = useRef<HTMLElement>(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [visibleSideCount, setVisibleSideCount] = useState(4);

    // Fetch real articles
    const { data: articles = [], loading, error } = useArticles();

    // Sort by ID descending and filter for approved articles
    const sortedById = useMemo(() => {
        return Array.isArray(articles) 
            ? [...articles]
                .filter(article => article.approved === true)
                .sort((a, b) => b.id - a.id) 
            : [];
    }, [articles]);

    // Highest ID = featured
    const featuredArticle = useMemo(() => {
        return sortedById.length > 0 ? sortedById[0] : null;
    }, [sortedById]);

    const allSideArticles = useMemo(() => {
        return sortedById.slice(1, 1 + MAX_SIDE_ARTICLES);
    }, [sortedById]);

    const sideArticles = useMemo(() => {
        return allSideArticles.slice(0, visibleSideCount);
    }, [allSideArticles, visibleSideCount]);

    useEffect(() => {
        const featuredColumn = featuredRef.current;
        const headlineSection = headlineSectionRef.current;
        const sideArticlesEl = sideArticlesRef.current;
        if (!featuredColumn || !headlineSection) {
            return;
        }

        const updateVisibleSideCount = () => {
            const viewportWidth = getVisualViewportWidth();
            const isStacked = viewportWidth <= VIEWPORT_COMPACT_MAX;

            const featuredCard = featuredColumn.querySelector<HTMLElement>(
                ".featured-article"
            );
            const featuredHeight = featuredCard?.getBoundingClientRect().height ?? 0;

            if (sideArticlesEl) {
                sideArticlesEl.style.height = isStacked || featuredHeight <= 0
                    ? ""
                    : `${featuredHeight}px`;
            }

            if (isStacked) {
                setVisibleSideCount(
                    Math.min(allSideArticles.length, DEFAULT_SIDE_ARTICLE_COUNT)
                );
                return;
            }

            if (featuredHeight <= 0) {
                return;
            }

            const maxByHeight = Math.floor(
                (featuredHeight + SIDE_ARTICLE_GAP) /
                    (SIDE_ARTICLE_MIN_HEIGHT + SIDE_ARTICLE_GAP)
            );
            const isLargeScreen = viewportWidth >= VIEWPORT_HOME_LARGE_MIN;
            const wantsFive =
                isLargeScreen &&
                maxByHeight >= LARGE_SIDE_ARTICLE_COUNT;
            const targetCount = wantsFive
                ? LARGE_SIDE_ARTICLE_COUNT
                : DEFAULT_SIDE_ARTICLE_COUNT;
            const clamped = Math.max(
                1,
                Math.min(targetCount, maxByHeight, allSideArticles.length)
            );
            setVisibleSideCount(clamped);
        };

        const observer = new ResizeObserver(updateVisibleSideCount);
        observer.observe(featuredColumn);
        observer.observe(headlineSection);
        const unsubscribeViewport = subscribeVisualViewport(updateVisibleSideCount);
        updateVisibleSideCount();

        return () => {
            observer.disconnect();
            unsubscribeViewport();
            if (sideArticlesEl) {
                sideArticlesEl.style.height = "";
            }
        };
    }, [allSideArticles.length, loading, featuredArticle?.id]);

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
            {/* SEO Meta Tags for Social Media Embedding */}
            <SEO
                title="Volleyball 4-2 - Official Roblox Volleyball League"
                description="Join the official Roblox Volleyball League (RVL). Watch matches, track player stats, view team rankings, and stay updated with the latest volleyball news and events."
                image="https://volleyball4-2.com/rvlLogo.png"
                url="https://volleyball4-2.com"
                type="website"
                structuredData={{
                    "@context": "https://schema.org",
                    "@type": "WebSite",
                    "name": "Volleyball 4-2",
                    "alternateName": "RVL",
                    "url": "https://volleyball4-2.com",
                    "description": "Official Roblox Volleyball League - Competitive volleyball gaming community",
                    "publisher": {
                        "@type": "Organization",
                        "name": "Roblox Volleyball League",
                        "logo": {
                            "@type": "ImageObject",
                            "url": "https://volleyball4-2.com/rvlLogo.png"
                        }
                    },
                    "potentialAction": {
                        "@type": "SearchAction",
                        "target": "https://volleyball4-2.com/search?q={search_term_string}",
                        "query-input": "required name=search_term_string"
                    }
                }}
            />

            <main className={`home ${loading ? 'loading' : ''}`}>
                <section className="headline-section" ref={headlineSectionRef}>
                    <div className="headline-featured" ref={featuredRef}>
                        {loading ? (
                            <div className="featured-article">
                                <div className="home-skeleton-featured"></div>
                            </div>
                        ) : featuredArticle ? (
                            <Link to={`/articles/${featuredArticle.id}`}>
                                <div className="featured-article">
                                    {error && <p>Error: {error}</p>}
                                    {!error && (
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
                        ) : (
                            <div className="featured-article">
                                <div className="featured-text">
                                    <h2>No Featured Articles Yet</h2>
                                    <p>Check back soon for the latest news and updates!</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <aside className="side-articles" ref={sideArticlesRef}>
                        {loading ? (
                            // Skeleton loaders for side articles
                            Array.from({ length: visibleSideCount }).map((_, index) => (
                                <div key={index} className="home-skeleton-side"></div>
                            ))
                        ) : error ? (
                            <p>Error loading articles: {error}</p>
                        ) : sideArticles.length > 0 ? (
                            sideArticles.map(article => (
                                <Link
                                    key={article.id}
                                    to={`/articles/${article.id}`}
                                >
                                    <article>
                                        <h4>{article.title}</h4>
                                        {article.imageUrl && (
                                            <img src={article.imageUrl} alt={article.title} />
                                        )}
                                    </article>
                                </Link>
                            ))
                        ) : (
                            <div className="no-articles">
                                <p>No recent articles available.</p>
                                <p>More content coming soon!</p>
                            </div>
                        )}
                    </aside>
                </section>

                {/* Full-bleed breakout: 100vw plus a negative margin pulls the
                    section out of the padded page column. pt-[56.25%] is the 16:9
                    box the absolutely-positioned player fills. */}
                <section
                    className="relative w-screen ml-[calc(-50vw_+_50%)] pt-[56.25%] mb-[-1px] rounded-[10px] overflow-hidden shadow-[0_3px_12px_rgb(0_0_0_/_0.1)] [&>iframe]:absolute! [&>iframe]:top-0 [&>iframe]:left-0 [&>iframe]:w-full! [&>iframe]:h-full! upto-md:ml-[-0.5rem] upto-md:mr-[-0.5rem] upto-md:w-[calc(100%_+_1rem)] upto-md:rounded-none"
                    ref={videoContainerRef}
                    aria-label="Volleyball promotional video"
                >
                    {/* The player is styled from the section via [&>iframe], not
                        from a class on the div. The YouTube API destroys this div
                        and inserts an iframe in its place, so any class written
                        here only survives if the API copies the attribute across;
                        targeting the child instead does not depend on that. The
                        importants stay because the API writes width and height
                        inline on the iframe and these have to outrank it. */}
                    <div id="yt-player" className="absolute! top-0 left-0 w-full! h-full!" />
                </section>

                {/* min-h-[500px] is deliberately left at 500 on narrow screens.
                    The original set height to 300/250 there without touching
                    min-height, so the floor won and the banner stayed 500 tall.
                    Reproduced rather than corrected - that is a look change. */}
                <section className="relative w-screen ml-[calc(-50vw_+_50%)] mt-0 mb-[-1rem] h-[500px] min-h-[500px] rounded-[10px] overflow-hidden shadow-[0_3px_12px_rgb(0_0_0_/_0.1)] min-[1600px]:h-[600px] min-[1600px]:min-h-[600px] min-[2000px]:h-[700px] min-[2000px]:min-h-[700px] upto-md:h-[300px] upto-xs:h-[250px] vp-mobile:h-[300px]">
                    <img
                        src={promoImg}
                        alt="Volleyball App Promo"
                        className="absolute top-0 left-0 w-full h-full object-cover z-[1]"
                    />
                    <div className="cta-text">
                        <button
                            className={joinButton}
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
