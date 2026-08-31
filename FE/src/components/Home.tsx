import React, { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
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
/* ── Landing page utilities ──────────────────────────────────────────────────
   Named because several are long and two are used more than once. Every value
   is literal rather than a scale step: this page was written in rem and px that
   do not line up with Tailwind's scale, and rounding them is a look change.

   The vp-* variants are not duplicates of the upto-* ones. upto-* are width
   media queries; vp-* key off the data-viewport attribute the app derives from
   the visual viewport, so they also fire when the page is zoomed rather than
   merely narrow, and they outrank a media query on specificity - which is how
   the originals behaved. */

const headlineSection =
    "w-full max-w-[2400px] mx-auto py-0 px-[2vw] flex gap-[2rem] mt-[2rem] mb-[4rem] min-h-[400px] items-stretch " +
    "upto-xl:gap-[1.5rem] min-[1400px]:gap-[2.5rem] min-[1600px]:gap-[3rem] " +
    "upto-1024:flex-col upto-1024:gap-[2rem] upto-1024:items-stretch " +
    "upto-md:mt-[1rem] upto-md:mb-[2rem] " +
    "vp-compact:flex-col vp-compact:gap-[2rem] vp-compact:items-stretch " +
    "vp-mobile:flex-col vp-mobile:gap-[2rem] vp-mobile:items-stretch " +
    "vp-mobile:mt-[1rem] vp-mobile:mb-[2rem] " +
    // Reserves the column height before the articles arrive, so nothing jumps.
    "empty:before:content-[''] empty:before:block empty:before:h-[400px] empty:before:w-full";

/* `featured-article` is a JS hook, not decoration: the ResizeObserver effect
   above calls querySelector(".featured-article") to measure the card and decide
   how many side articles fit. Removing the class breaks that measurement. */
const featuredArticleBase =
    "featured-article flex-1 relative rounded-[8px] overflow-hidden " +
    "shadow-[0_2px_8px_rgb(0_0_0_/_0.1)] aspect-[17.5/9] min-h-[300px] w-full max-w-none " +
    "upto-1024:aspect-[16/9] vp-compact:aspect-[16/9] vp-mobile:aspect-[16/9]";

/* Only the card inside the <Link> animates; the loading and empty cards are not
   wrapped in one, and the original selector was scoped to `> a` accordingly. */
const featuredArticleLinked =
    featuredArticleBase + " transition-[transform] duration-300 ease-[ease] group-hover:[transform:scale(1.02)]";

const featuredText =
    "absolute bottom-0 w-full text-white py-[1rem] px-[1.5rem] " +
    "bg-[linear-gradient(to_top,rgba(0,0,0,0.75),transparent)] " +
    "upto-md:py-[0.75rem] upto-md:px-[1rem] vp-mobile:py-[0.75rem] vp-mobile:px-[1rem]";

const featuredHeading =
    "m-0 mb-[1rem] text-[2.5rem] font-bold " +
    "upto-1024:text-[2rem] upto-md:text-[1.5rem] upto-md:mb-[0.5rem] upto-xs:text-[1.25rem] " +
    "vp-compact:text-[2rem] vp-mobile:text-[1.5rem] vp-mobile:mb-[0.5rem]";

const featuredSummary = "m-0 text-[1rem] font-medium upto-md:text-[0.9rem] vp-mobile:text-[0.9rem]";

const badgeBase =
    "inline-block font-semibold text-[0.75rem] py-[0.15rem] px-[0.5rem] rounded-[4px] mb-[0.3rem] " +
    "upto-xs:text-[0.7rem] upto-xs:py-[0.1rem] upto-xs:px-[0.4rem]";

const sideArticlesPanel =
    "flex-1 flex flex-col gap-[1rem] min-w-[280px] max-w-[400px] pl-[1.5rem] " +
    "border-l border-l-[#eee] justify-stretch items-stretch box-border min-h-0 overflow-hidden " +
    "upto-xl:min-w-[260px] upto-xl:max-w-[350px] upto-xl:pl-[1rem] " +
    "min-[1400px]:min-w-[320px] min-[1400px]:max-w-[450px] min-[1400px]:pl-[2rem] " +
    "min-[1600px]:pl-[2.5rem] " +
    "upto-1024:pl-0 upto-1024:border-l-0 upto-1024:border-t upto-1024:border-t-[#eee] upto-1024:pt-[1.5rem] upto-1024:min-w-auto upto-1024:max-w-none upto-1024:overflow-visible " +
    "vp-compact:pl-0 vp-compact:border-l-0 vp-compact:border-t vp-compact:border-t-[#eee] vp-compact:pt-[1.5rem] vp-compact:min-w-auto vp-compact:max-w-none vp-compact:overflow-visible " +
    "vp-mobile:pl-0 vp-mobile:border-l-0 vp-mobile:border-t vp-mobile:border-t-[#eee] vp-mobile:pt-[1.5rem] vp-mobile:min-w-auto vp-mobile:max-w-none vp-mobile:overflow-visible";

const sideArticleLink =
    "group flex flex-1 min-h-0 no-underline text-inherit " +
    "upto-1024:flex-none vp-compact:flex-none vp-mobile:flex-none";

/* transition-[transform], not transition-all: the base rule said `all`, but the
   more specific `.side-articles > a article` overrode it with `transform`, and
   every side article is inside that link. This is the value that actually won. */
const sideArticleCard =
    "flex justify-between items-center gap-[1rem] rounded-[8px] shadow-[0_2px_6px_rgb(0_0_0_/_0.1)] " +
    "p-[0.75rem] bg-white cursor-pointer flex-1 min-h-0 box-border w-full " +
    "transition-[transform] duration-300 ease-[ease] " +
    "hover:bg-[#f0f0f0] group-hover:[transform:scale(1.02)] " +
    "min-[1400px]:p-[1rem] " +
    "upto-1024:flex-none upto-1024:h-[90px] upto-1024:min-h-[90px] " +
    "upto-xs:flex-col upto-xs:items-start upto-xs:min-h-auto " +
    "vp-compact:flex-none vp-compact:h-[90px] vp-compact:min-h-[90px] " +
    "vp-mobile:flex-none vp-mobile:h-[90px] vp-mobile:min-h-[90px] " +
    "coarse:cursor-default coarse:active:bg-[#f0f0f0]";

const sideArticleTitle =
    "m-0 text-[1.1rem] font-semibold leading-[1.3] flex-1 no-underline text-inherit " +
    "upto-md:text-[1rem] upto-xs:text-[0.9rem] vp-mobile:text-[1rem]";

const sideArticleThumb =
    "w-[100px] h-[60px] object-cover rounded-[6px] shrink-0 " +
    "min-[1400px]:w-[110px] min-[1400px]:h-[70px] " +
    "upto-1024:w-[100px] upto-1024:h-[70px] " +
    "upto-xs:w-full upto-xs:h-[150px] upto-xs:mt-[0.5rem] " +
    "vp-compact:w-[100px] vp-compact:h-[70px] vp-mobile:w-[100px] vp-mobile:h-[70px]";

const skeletonBase =
    "bg-[linear-gradient(90deg,#f0f0f0_25%,#e0e0e0_50%,#f0f0f0_75%)] bg-[length:200%_100%] " +
    "animate-skeleton-sweep rounded-[8px] w-full";

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

            <main
                className={`w-full max-w-[2400px] mx-auto my-0 py-[1rem] px-[2vw] text-[#222] box-border min-h-screen [contain:layout_style_paint] [font-family:'Segoe_UI',Tahoma,Geneva,Verdana,sans-serif] upto-md:p-[0.5rem] vp-mobile:p-[0.5rem] ${loading ? 'opacity-80 pointer-events-none' : ''}`}
            >
                <section className={headlineSection} ref={headlineSectionRef}>
                    <div className="flex-[2] min-w-0 flex flex-col self-start" ref={featuredRef}>
                        {loading ? (
                            <div className={featuredArticleBase}>
                                <div className={`${skeletonBase} h-full min-h-[300px]`}></div>
                            </div>
                        ) : featuredArticle ? (
                            <Link
                                to={`/articles/${featuredArticle.id}`}
                                className="group flex flex-1 min-h-0 no-underline text-inherit hover:no-underline hover:text-inherit"
                            >
                                <div className={featuredArticleLinked}>
                                    {error && <p>Error: {error}</p>}
                                    {!error && (
                                        <>
                                            <img
                                                src={featuredArticle.imageUrl}
                                                alt={featuredArticle.title}
                                                className="w-full h-full object-cover block"
                                            />
                                            <div className={featuredText}>
                                                <span className={`${badgeBase} bg-[#edbb00]`}>
                                                    By {featuredArticle.author.username}
                                                </span>
                                                <span className={`${badgeBase} bg-[silver]`}>
                                                    {new Date(
                                                        featuredArticle.createdAt
                                                    ).toLocaleDateString()}
                                                </span>
                                                <h2 className={featuredHeading}>{featuredArticle.title}</h2>
                                                <p className={featuredSummary}>{featuredArticle.summary}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </Link>
                        ) : (
                            <div className={featuredArticleBase}>
                                <div className={featuredText}>
                                    <h2 className={featuredHeading}>No Featured Articles Yet</h2>
                                    <p className={featuredSummary}>
                                        Check back soon for the latest news and updates!
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <aside className={sideArticlesPanel} ref={sideArticlesRef}>
                        {loading ? (
                            // Skeleton loaders for side articles
                            Array.from({ length: visibleSideCount }).map((_, index) => (
                                <div key={index} className={`${skeletonBase} flex-1 min-h-[80px]`}></div>
                            ))
                        ) : error ? (
                            <p>Error loading articles: {error}</p>
                        ) : sideArticles.length > 0 ? (
                            sideArticles.map(article => (
                                <Link
                                    key={article.id}
                                    to={`/articles/${article.id}`}
                                    className={sideArticleLink}
                                >
                                    <article className={sideArticleCard}>
                                        <h4 className={sideArticleTitle}>{article.title}</h4>
                                        {article.imageUrl && (
                                            <img
                                                src={article.imageUrl}
                                                alt={article.title}
                                                className={sideArticleThumb}
                                            />
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
