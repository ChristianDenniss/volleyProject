import React, { useEffect, useRef, useState } from "react";
import "../styles/Home.css";
import promoImg from "../images/callToAction.png";

const Home: React.FC = () =>
{
    const playerRef = useRef<any>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);

    // Load YouTube IFrame API and initialize player
    useEffect(() =>
    {
        const createPlayer = () =>
        {
            const YT = (window as any).YT;

            if (!YT || !YT.Player)
            {
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
                    onReady: () =>
                    {
                        console.log("YT Player ready");
                        setIsPlayerReady(true);
                    }
                }
            });
        };

        if (!document.getElementById("youtube-iframe-api"))
        {
            const tag = document.createElement("script");
            tag.id = "youtube-iframe-api";
            tag.src = "https://www.youtube.com/iframe_api";
            document.body.appendChild(tag);
            console.log("YT API script added");

            (window as any).onYouTubeIframeAPIReady = () =>
            {
                createPlayer();
            };
        }
        else if ((window as any).YT && (window as any).YT.Player)
        {
            createPlayer();
        }
        else
        {
            (window as any).onYouTubeIframeAPIReady = () =>
            {
                createPlayer();
            };
        }

        return () =>
        {
            delete (window as any).onYouTubeIframeAPIReady;

            if (playerRef.current)
            {
                playerRef.current.destroy();
                playerRef.current = null;
                setIsPlayerReady(false);
            }
        };
    }, []);

    // Intersection Observer to play/pause video when mostly in viewport
    useEffect(() =>
    {
        if (!videoContainerRef.current || !isPlayerReady || !playerRef.current)
        {
            return;
        }

        const observer = new IntersectionObserver((entries) =>
        {
            entries.forEach((entry) =>
            {
                if (entry.isIntersecting && entry.intersectionRatio > 0.6)
                {
                    playerRef.current.playVideo();
                }
                else
                {
                    playerRef.current.pauseVideo();
                }
            });
        }, { threshold: [0, 0.6, 1] });

        observer.observe(videoContainerRef.current);

        return () =>
        {
            observer.disconnect();
        };
    }, [isPlayerReady]);

    return (
        <div style={{ overflowX: "hidden" }}>
            <main className="home">
                <section className="headline-section">
                    <div className="featured-article">
                        <img
                            src="https://i.imgur.com/IWb2Nu7.jpg"
                            alt="Volleyball Team"
                            className="featured-image"
                        />
                        <div className="featured-text">
                            <span className="tag">PLUSLIGA 2024-2025</span>
                            <span className="date-tag">May 16th 2025</span>
                            <h2>Jastrzębski take first spot in the PlusLiga semifinals</h2>
                            <p>Lublin sweep ZAKSA on the road and level the series 1-1</p>
                        </div>
                    </div>
                    <aside className="side-articles">
                        <article>
                            <h4>Olympic champions back at the top of the World Ranking</h4>
                            <img src="https://i.imgur.com/ClU67cG.jpg" alt="Olympic Champions" />
                        </article>
                        <article>
                            <h4>Tickets for the 2025 Beach Volleyball World Championships now available</h4>
                            <img src="https://i.imgur.com/7LTg2Af.jpg" alt="Tickets" />
                        </article>
                        <article>
                            <h4>Novara end Conegliano's 50-match winning streak</h4>
                            <img src="https://i.imgur.com/DOaxjke.jpg" alt="Novara Match" />
                        </article>
                        <article>
                            <h4>Carol and Rebecca claim Quintana Roo gold</h4>
                            <img src="https://i.imgur.com/3BGYpkR.jpg" alt="Carol and Rebecca" />
                        </article>
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
                        <button className="join-button" onClick={() => alert("Join RVL Today!")}>
                            Join RVL Today
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Home;
