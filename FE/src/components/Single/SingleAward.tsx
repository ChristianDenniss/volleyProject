import React, { useEffect } from "react"
import { useParams } from "react-router-dom"
import { useSingleAward } from "../../hooks/allFetch"
import "../../styles/SingleAward.css"
import defaultImage from "../../images/rvlLogo.png"
import SEO from "../SEO"

/*  Award type → full display string (NBA-style) with updated honoree blurbs  */
const awardTypeDescriptions: { [key: string]: string } =
{
    "MVP":
        "Enzoofbrazil Trophy (Most Valuable Player) – The Most Valuable Player award is presented to the player who made the most significant impact on their team's success and is named in honor of Enzoofbrazil for their legendary tenure of dominance and multiple MVP-caliber seasons in RVL.",
    "DPOS":
        "hovay Trophy (Defensive Player of the Season) – The Defensive Player of the Season award is presented to the player who demonstrated exceptional defensive skills throughout the season and is named in honor of lhovay for their era-defining stretch of defensive supremacy in RVL.",
    "FMVP":
        "agtheboss Trophy (Finals Most Valuable Player) – The Finals Most Valuable Player award is presented to the player who made the most significant impact in the championship series and is named in honor of agtheboss36 for their many clutch performances embodying the spirit of this award.",
    "MIP":
        "Lxaserr Trophy (Most Improved Player) – The Most Improved Player award is presented to the player who showed the greatest improvement throughout the season and is named in honor of Lxaserr for their breakout season which embodied exactly what this award is all about.",

    /*  Filled-in individual skill awards  */
    "Best Spiker":
        "sedrata Trophy (Best Spiker) – The Best Spiker award is presented to the player with the most effective and efficent attacks and is named in honor of sedrata for their unrivaled scoring and consistency in spiking, setting the benchmark for attacking greatness in 4.2.",
    "Best Setter":
        "Bacon Trophy (Best Setter) – The Best Setter award is presented to the player who excelled at setting up their teammates for successful attacks and is named in honor of Bay_kun for their long-standing excellence and consistency as one of RVL's premier playmaking setters.",
    "Best Receiver":
        "ykRising Trophy (Best Receiver) – The Best Receiver award is presented to the player who excelled at receiving serves and attacks and is named in honor of ykRising for their record-breaking reception season that redefined ground defence reliability.",
    "Best Blocker":
        "ky_xn Trophy (Best Blocker) – The Best Blocker award is presented to the player who excelled at blocking opponent attacks and is named in honor of ky_xn for their towering net presence and game-changing reads that anchored defenses across multiple seasons.",
    "Best Libero":
        "danikid Trophy (Best Libero) – The Best Libero award is presented to the player who demonstrated exceptional defensive skills and ball control and is named in honor of danikid246 for their longevity and tireless back-row leadership that set the standard for libero play.",
    "Best Aper":
        "Jxbito Trophy (Best Aper) – The Best Aper award is presented to the player who showed outstanding all-around performance in ape-style attacks and is named in honor of Jxbito for their insane, highlight-reel performances that pushed the limits of apeing strategy.",
    "Best Server":
        "yolmi Trophy (Best Server) – The Best Server award is presented to the player with the most effective and consistent serves and is named in honor of y_olmi for their creative, unpredictable service patterns that turned every rotation into a tactical advantage.",

    /*  Community recognition  */
    "LuvLate Award":
        "LuvLate Award – Special recognition for outstanding contribution to the community"
};

const awardContainer =
    "my-[4rem] mx-auto max-w-[1050px] px-[1.5rem] bg-[#0e0e0e] rounded-lg " +
    "shadow-[0_8px_22px_rgb(0_0_0_/_0.45)] overflow-hidden " +
    "font-['Poppins','Segoe_UI',Tahoma,Geneva,Verdana,sans-serif] text-[#f5f5f5] " +
    "min-h-screen box-border [contain:layout_style_paint] " +
    "upto-sm:my-[2rem] upto-sm:px-[1rem] " +
    "empty:before:content-[''] empty:before:block empty:before:h-[800px] empty:before:w-full"

/* The overlay is a ::before so it stays a pseudo-element. */
const awardHeader =
    "relative h-[320px] min-h-[320px] bg-cover bg-center " +
    "transition-[background-image] duration-300 ease-out " +
    "rounded-t-lg upto-sm:h-[220px] " +
    "before:content-[''] before:absolute before:inset-0 " +
    "before:bg-[linear-gradient(to_bottom,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.35)_40%,rgba(0,0,0,0.55)_100%)]"

const awardTitleSection =
    "absolute top-1/2 left-1/2 [transform:translate(-50%,-50%)] z-[1] text-center w-[90%] max-w-[900px]"

const awardTitle =
    "text-[5.5rem] font-bold whitespace-nowrap text-[#c9e4fd] mb-[1rem] upto-sm:text-[3.8rem]"

const awardSeason = "inline-block text-[2.2rem] font-semibold text-[#f5f5f5] upto-sm:text-[1.8rem]"

const awardTypeDescription =
    "py-[1.75rem] px-[2rem] bg-[#161616] border-b border-b-[rgba(255,255,255,0.08)] " +
    "[&_p]:m-0 [&_p]:text-[1.25rem] [&_p]:leading-[1.55]"

const awardContent =
    "p-[2rem] grid gap-[2rem] min-h-[400px] [content-visibility:auto] [contain-intrinsic-size:400px] " +
    "upto-sm:p-[1.5rem] " +
    "[&_h2]:m-0 [&_h2]:mb-[0.75rem] [&_h2]:text-[1.8rem] [&_h2]:text-[#c9e4fd]"

const awardDescriptionP = "text-[1.5rem] leading-[1.6] text-[#f5f5f5]"

const recipientInfo = "whitespace-normal text-[1.5rem]"

const playerLink =
    "text-[#f5f5f5] font-semibold no-underline transition-[color] duration-200 ease-[ease] text-[1.5rem] " +
    "hover:text-[#c9e4fd]"

const awardMeta =
    "grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[1.25rem] bg-[#161616] p-[1.5rem] rounded-lg"

const metaItem = "flex flex-col"

const metaHeading =
    "m-0 mb-[0.4rem] text-[1.1rem] font-bold uppercase text-[#c1c1c1] tracking-[0.05em]"

const metaValue = "m-0 text-[1.25rem] font-semibold"

const skeletonSweep =
    "bg-[linear-gradient(90deg,#2a2a2a_25%,#3a3a3a_50%,#2a2a2a_75%)] bg-[length:200%_100%] " +
    "animate-skeleton-sweep"

const SingleAward: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const { data: award, error, loading } = useSingleAward(id || "")

    // Add and remove the dark theme class
    useEffect(() => {
        document.body.classList.add('single-award-page')
        return () => {
            document.body.classList.remove('single-award-page')
        }
    }, [])

    if (!id) return <div className={awardContainer}>URL ID is undefined</div>

    return (
        <div className={`${awardContainer} ${loading ? "opacity-80 pointer-events-none" : ""}`}>
            {loading ? (
                <>
                    <div className={`${skeletonSweep} h-[320px] w-full rounded-t-lg`}></div>
                    <div className={`${skeletonSweep} h-[60px] w-full py-[1.75rem] px-[2rem] bg-[#161616] border-b border-b-[rgba(255,255,255,0.08)]`}></div>
                    <div className={awardContent}>
                        <div className={`${skeletonSweep} h-[100px] w-full rounded-lg`}></div>
                        <div className={`${skeletonSweep} h-[100px] w-full rounded-lg`}></div>
                        <div className={awardMeta}>
                            <div className={`${skeletonSweep} h-[80px] w-full rounded-[8px]`}></div>
                            <div className={`${skeletonSweep} h-[80px] w-full rounded-[8px]`}></div>
                            <div className={`${skeletonSweep} h-[80px] w-full rounded-[8px]`}></div>
                        </div>
                    </div>
                </>
            ) : error ? (
                <div className={awardContainer}>Error: {error}</div>
            ) : !award ? (
                <div className={awardContainer}>No award found.</div>
            ) : (
                <>
                    {/* SEO Meta Tags for Social Media Embedding */}
                    <SEO
                        title={`${award.type} - Season ${award.season.seasonNumber}`}
                        description={`${award.type} award winner${award.players && award.players.length > 1 ? 's' : ''}: ${award.players?.map(p => p.name).join(', ')}. Season ${award.season.seasonNumber} of the Roblox Volleyball League.`}
                        image={award.imageUrl || "https://volleyball4-2.com/rvlLogo.png"}
                        url={`https://volleyball4-2.com/awards/${award.id}`}
                        type="article"
                        publishedTime={new Date(award.createdAt).toISOString()}
                        author={award.players?.map(p => p.name).join(', ')}
                        section="Awards"
                        tags={["volleyball", "roblox", "RVL", "awards", "gaming", "sports"]}
                        structuredData={{
                            "@context": "https://schema.org",
                            "@type": "Award",
                            "name": award.type,
                            "description": award.description || `${award.type} award for Season ${award.season.seasonNumber}`,
                            "image": award.imageUrl || "https://volleyball4-2.com/rvlLogo.png",
                            "url": `https://volleyball4-2.com/awards/${award.id}`,
                            "awardedFor": "Volleyball Excellence",
                            "awardedBy": {
                                "@type": "Organization",
                                "name": "Roblox Volleyball League",
                                "url": "https://volleyball4-2.com"
                            },
                            "recipient": award.players?.map(player => ({
                                "@type": "Person",
                                "name": player.name,
                                "url": `https://volleyball4-2.com/players/${player.id}`
                            })) || [],
                            "dateCreated": new Date(award.createdAt).toISOString(),
                            "category": "Sports Award",
                            "sport": "Volleyball"
                        }}
                    />

                    <div className={awardHeader} style={{ backgroundImage: `url(${award.imageUrl || defaultImage})` }}>
                        <div className={awardTitleSection}>
                            <h1 className={awardTitle}>{award.type}</h1>
                            <span className={awardSeason}>Season {award.season.seasonNumber}</span>
                        </div>
                    </div>

                    <div className={awardTypeDescription}>
                        <p>{awardTypeDescriptions[award.type] || "A special recognition for outstanding achievement"}</p>
                    </div>

                    <div className={awardContent}>
                        {award.description && (
                            <div>
                                <h2>Description</h2>
                                <p className={awardDescriptionP}>{award.description}</p>
                            </div>
                        )}

                        <div>
                            <h2>Recipient</h2>
                            {award.players && award.players.length > 0 ? (
                                <div className={recipientInfo}>
                                    {award.players.map((player, index) => (
                                        <React.Fragment key={player.id}>
                                            <a href={`/players/${player.id}`} className={playerLink}>
                                                {player.name}
                                            </a>
                                            {index < award.players.length - 1 && ", "}
                                        </React.Fragment>
                                    ))}
                                </div>
                            ) : (
                                <p>No recipients recorded for this award.</p>
                            )}
                        </div>

                        <div className={awardMeta}>
                            <div className={metaItem}>
                                <h3 className={metaHeading}>Award Type</h3>
                                <p className={metaValue}>{award.type}</p>
                            </div>
                            <div className={metaItem}>
                                <h3 className={metaHeading}>Season</h3>
                                <p className={metaValue}>Season {award.season.seasonNumber}</p>
                            </div>
                            <div className={metaItem}>
                                <h3 className={metaHeading}>Awarded On</h3>
                                <p className={metaValue}>{new Date(award.createdAt).toLocaleDateString()}</p>
                            </div>
                            {award.players && award.players.length > 0 && (
                                <div className={metaItem}>
                                    <h3 className={metaHeading}>Team</h3>
                                    <p className={metaValue}>
                                        {award.players.map((player, index) => {
                                            const seasonTeam = player.teams?.find(team => 
                                                team.season?.seasonNumber === award.season.seasonNumber
                                            );
                                            return (
                                                <React.Fragment key={player.id}>
                                                    {seasonTeam ? seasonTeam.name : "No team data"}
                                                    {index < award.players.length - 1 && ", "}
                                                </React.Fragment>
                                            );
                                        })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default SingleAward
