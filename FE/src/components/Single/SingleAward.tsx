import React, { useEffect } from "react"
import { useParams } from "react-router-dom"
import { useSingleAward } from "../../hooks/allFetch"
import "../../styles/SingleAward.css"
import defaultImage from "../../images/rvlLogo.png"

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

    if (!id) return <div className="award-container">URL ID is undefined</div>
    if (loading) return <div className="award-container">Loading...</div>
    if (error) return <div className="award-container">Error: {error}</div>
    if (!award) return <div className="award-container">No award found.</div>

    return (
        <div className="award-container">
            <div className="award-header" style={{ backgroundImage: `url(${award.imageUrl || defaultImage})` }}>
                <div className="award-title-section">
                    <h1>{award.type}</h1>
                    <span className="award-season">Season {award.season.seasonNumber}</span>
                </div>
            </div>

            <div className="award-type-description">
                <p>{awardTypeDescriptions[award.type] || "A special recognition for outstanding achievement"}</p>
            </div>

            <div className="award-content">
                {award.description && (
                    <div className="award-description">
                        <h2>Description</h2>
                        <p>{award.description}</p>
                    </div>
                )}

                <div className="award-recipients">
                    <h2>Recipient</h2>
                    {award.players && award.players.length > 0 ? (
                        <div className="recipient-info">
                            {award.players.map((player, index) => (
                                <React.Fragment key={player.id}>
                                    <a href={`/players/${player.name}`} className="player-link">
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

                <div className="award-meta">
                    <div className="meta-item">
                        <h3>Award Type</h3>
                        <p>{award.type}</p>
                    </div>
                    <div className="meta-item">
                        <h3>Season</h3>
                        <p>Season {award.season.seasonNumber}</p>
                    </div>
                    <div className="meta-item">
                        <h3>Awarded On</h3>
                        <p>{new Date(award.createdAt).toLocaleDateString()}</p>
                    </div>
                    {award.players && award.players.length > 0 && (
                        <div className="meta-item">
                            <h3>Team</h3>
                            <p>
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
        </div>
    )
}

export default SingleAward
