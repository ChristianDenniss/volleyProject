import React, { useEffect, useState } from "react"
import { useSinglePlayer, useAwardsByPlayerID } from "../../hooks/allFetch"
import { useParams } from "react-router-dom"
import { useRegion } from "../../context/regionContext"
import type { RegionCode } from "../../types/interfaces"
import { getRobloxAvatarUrl } from "../../utils/fetchAvatarRoblox"
import Select from "react-select"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
    faTrophy, 
    faVolleyballBall, 
    faMedal, 
    faCrown, 
    faAward,
    faShieldAlt,
    faHandSparkles,
    faBolt,
    faCrosshairs,
    faUserShield,
    faShield,
    faLock,
    faStar,
    faRing,
} from '@fortawesome/free-solid-svg-icons'
import SEO from "../SEO"

/* `player-profile-container` stays a class: App.css dark-scrollbar rules
   target it. A later rule in SinglePlayer.css overrode `contain` from
   `layout style paint` to `layout style`; content-visibility: auto was only
   on the first rule and was not overridden. */
const playerProfileContainer =
    "player-profile-container max-w-full min-w-full mx-auto py-[1rem] px-[2rem] " +
    "[font-family:'Segoe_UI',Tahoma,Geneva,Verdana,sans-serif] text-[#f5f5f5] bg-[#0e0e0e] " +
    "box-border flex flex-col min-h-screen [contain:layout_style] [content-visibility:auto]"

const playerProfileContainerLoading = playerProfileContainer + " opacity-80 pointer-events-none"

const playerMainHeader =
    "flex justify-center items-start flex-wrap mb-[1.5rem] gap-[2rem]"

const playerMainHeaderLoading = playerMainHeader + " min-h-[400px]"

const avatarHeaderInfo =
    "flex items-center justify-center gap-[2rem] flex-nowrap w-full max-w-[1200px] " +
    "mx-auto px-[1rem] upto-lg:flex-col"

const avatarHeaderInfoLoading = avatarHeaderInfo + " min-h-[350px]"

const playerNameLarge =
    "text-[2.8rem] font-bold uppercase text-white mt-0 mx-0 mb-[1rem] " +
    "upto-lg:text-[2rem] upto-sm:text-[1.5rem]"

const playerAvatar =
    "w-[580px] h-[580px] rounded-[12px] object-cover [contain:layout_style] " +
    "upto-lg:w-[350px] upto-lg:h-[350px] upto-sm:w-[250px] upto-sm:h-[250px]"

const playerMeta = "flex flex-col gap-[0.5rem] text-[1rem] text-[#ccc] font-medium"

const playerProfilesGrid =
    "flex flex-col gap-[1.5rem] mx-auto mb-[1.5rem] w-full min-w-full box-border"

const playerProfilesGridLoading = playerProfilesGrid + " min-h-[600px]"

const playerCard =
    "bg-[#1a1a1a] rounded-[12px] pt-[1.5rem] px-[2rem] pb-[2rem] " +
    "shadow-[0_0_12px_rgba(0,0,0,0.3)] w-full min-w-full box-border [contain:layout_style]"

const playerCardLoading = playerCard + " min-h-[500px]"

const playerStats = "flex flex-col gap-[1.5rem]"

const playerStatsLoading = playerStats + " min-h-[400px]"

const statCategoryH3 = "text-[1.25rem] font-bold text-[#eee] mt-0 mx-0 mb-[0.75rem]"

/* lg: is min-width 900px, matching the original min-width query. grid-cols-7
   is minmax(0, 1fr); the stylesheet used repeat(7, 1fr). */
const statGrid =
    "grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-0 bg-[#262626] " +
    "rounded-[8px] overflow-hidden w-full [contain:layout_style] " +
    "lg:grid-cols-[repeat(7,1fr)] " +
    "[&>:nth-child(7n)]:border-r-0 [&>:nth-last-child(-n+7)]:border-b-0"

const statItem =
    "bg-inherit p-[1rem] text-center border-r border-r-[#262626] border-b border-b-[#262626] " +
    "box-border text-[#fff]! font-semibold whitespace-nowrap overflow-hidden text-ellipsis"

const statLabel =
    "block text-[0.9rem] text-[#ffffff9e]! mb-[0.25rem] font-semibold " +
    "whitespace-nowrap overflow-hidden text-ellipsis"

const statValue =
    "text-[1.4rem] font-extrabold text-[#ffffff9e]! whitespace-normal overflow-visible " +
    "[text-overflow:unset]"

const playerSection =
    "w-full min-w-full mt-[1.5rem]"

const playerSectionLoading = playerSection + " min-h-[120px]"

const playerSectionH3 = "text-[1.5rem] font-bold text-[#eee] mt-0 mx-0 mb-[0.75rem]"

const playerSectionP = "m-0 text-[#aaa]"

const teamList =
    "list-none p-0 flex flex-wrap items-start gap-[1rem] w-full min-w-full"

const teamListItem =
    "flex [will-change:transform] [transform:translateZ(0)] [backface-visibility:hidden]"

const teamListLink =
    "block bg-[#202020] py-[0.6rem] px-[1.2rem] rounded-[6px] text-white font-medium " +
    "no-underline transition-all duration-200 ease-[ease] [contain:layout_style] " +
    "hover:bg-[#626262] hover:[transform:scale(1.05)]"

const avatarLeft = "flex flex-col items-center"
const avatarRight = "flex flex-col justify-start"

const showMoreGames =
    "bg-[#1a1a1a] text-[#ccc] border border-[#333] py-[0.4rem] px-[0.8rem] rounded-[4px] " +
    "font-medium cursor-pointer transition-all duration-200 ease-[ease] mt-[0.75rem] " +
    "text-[0.8rem] uppercase tracking-[0.5px] min-w-[120px] " +
    "hover:bg-[#333] hover:border-[#555] hover:[transform:scale(1.05)]"

/* Collapsed list hides the 5th item onward. Expanded restyles those items to
   display:block (not flex) - that is what the more-specific rule painted. */
const gameList =
    "list-none p-0 m-0 flex flex-wrap items-start gap-[0.5rem] " +
    "[&>li]:flex [&>li:nth-child(n+5)]:hidden"

const gameListExpanded =
    "list-none p-0 m-0 flex flex-wrap items-start gap-[0.5rem] " +
    "[&>li]:flex [&>li:nth-child(n+5)]:block"

const gameListLink =
    "block bg-[#202020] py-[0.6rem] px-[1.2rem] rounded-[6px] text-white font-medium " +
    "no-underline transition-all duration-200 ease-[ease] " +
    "hover:bg-[#626262] hover:[transform:scale(1.02)]"

const playerProfileAwardsList =
    "list-none p-0 m-0 flex flex-wrap gap-[1rem] w-full min-w-full"

const playerProfileAwardLink = "no-underline text-inherit block w-full h-full"

const playerProfileAwardItem =
    "group bg-[#202020] p-[1rem] rounded-[6px] text-white font-medium " +
    "transition-all duration-200 ease-[ease] min-w-[200px] cursor-pointer min-h-[120px] " +
    "[will-change:transform] [transform:translateZ(0)] [backface-visibility:hidden] " +
    "[contain:layout_style] hover:bg-[#626262] hover:[transform:scale(1.05)]"

const playerProfileAwardIcon =
    "text-[2.5rem] text-[#c9e4fd] mb-[0.75rem] " +
    "[filter:drop-shadow(0_2px_4px_rgba(201,228,253,0.3))] " +
    "transition-[transform,filter] duration-200 ease-[ease] " +
    "group-hover:[transform:scale(1.1)] " +
    "group-hover:[filter:drop-shadow(0_4px_8px_rgba(201,228,253,0.5))]"

const playerProfileAwardContent =
    "flex flex-col gap-[0.5rem] items-center text-center"

const playerProfileAwardType = "text-[1.2rem] font-semibold text-[#c9e4fd]"

const playerProfileAwardSeason = "text-[0.9rem] text-[#ffffff9e]"

const ringsDisplay = "flex justify-center items-center gap-[0.1rem] mb-[0.75rem]"

const championshipRing =
    "text-[2.5rem] text-[#ffd700] [filter:drop-shadow(0_2px_4px_rgba(255,215,0,0.6))] " +
    "transition-[transform,filter] duration-200 ease-[ease] " +
    "group-hover:[filter:drop-shadow(0_4px_8px_rgba(255,215,0,0.8))]"

const championshipRingSingle =
    championshipRing + " group-hover:[transform:scale(1.1)]"

/* .ring-left and .ring-right were declared twice. The two-ring offsets
   (-0.3rem / 15deg) were overwritten by the three-ring values, so those are
   what actually painted for both the 2-ring and 3-ring cases. Hover
   transform on .ring-left/.ring-right also beat the generic
   .championship-ring hover scale(1.1) at equal specificity. */
const championshipRingLeft =
    championshipRing +
    " [transform:translateX(-0.4rem)_translateY(0.1rem)_rotate(-20deg)] " +
    "group-hover:[transform:translateX(-0.4rem)_translateY(0.1rem)_rotate(-20deg)_scale(1.05)]"

const championshipRingRight =
    championshipRing +
    " [transform:translateX(0.4rem)_translateY(0.1rem)_rotate(20deg)] " +
    "group-hover:[transform:translateX(0.4rem)_translateY(0.1rem)_rotate(20deg)_scale(1.05)]"

const championshipRingCenter =
    championshipRing +
    " [transform:translateY(-0.1rem)] " +
    "group-hover:[transform:translateY(-0.1rem)_scale(1.05)]"

const playerHofSection =
    "w-full min-w-full mt-[1.5rem] bg-[#1a1a1a] rounded-[8px] p-[1.5rem] " +
    "shadow-[0_2px_4px_rgba(0,0,0,0.2)]"

const playerHofSectionLoading = playerHofSection + " min-h-[120px]"

const playerHofSectionGoat =
    "w-full min-w-full mt-[1.5rem] rounded-[8px] p-[1.5rem] " +
    "bg-[linear-gradient(135deg,#1a1a1a_0%,#2a1a1a_50%,#1a1a1a_100%)] " +
    "border-2 border-[#ffd700] " +
    "shadow-[0_0_20px_rgba(255,215,0,0.3),inset_0_0_20px_rgba(255,215,0,0.1)]"

const hofProgressContainer = "flex flex-col gap-[1rem] items-center"

const hofScoreRow = "flex items-center gap-[0.5rem] text-[1.5rem] text-[#ffd700]"

const hofIcon = "text-[#ffd700] text-[1.8rem]"

const hofScoreValue = "font-bold text-[#ffd700]"

const hofScoreValueGoat =
    "text-[7rem] font-black text-[#ffd700] " +
    "[text-shadow:0_0_5px_#ffd700,0_0_10px_#ffd700,0_0_15px_#ff6b35,0_0_20px_#ff6b35] " +
    "animate-goat-glow [filter:drop-shadow(0_0_10px_rgba(255,215,0,0.6))]"

const hofScoreMax = "text-[#666]"

const hofProgressBar =
    "w-full h-[20px] bg-[#333] rounded-[10px] overflow-hidden relative min-h-[20px]"

const hofProgressFill =
    "h-full bg-[linear-gradient(90deg,#2c5a7d,#4a90e2)] rounded-[10px] " +
    "transition-[width] duration-300 ease-[ease-in-out]"

const hofProgressFillGoat =
    "h-full rounded-[10px] transition-[width] duration-300 ease-[ease-in-out] " +
    "bg-[linear-gradient(90deg,#ffd700,#ff6b35,#ffd700)] bg-[length:200%_100%] " +
    "animate-goat-progress shadow-[0_0_15px_rgba(255,215,0,0.8)]"

const hofStatus = "text-[1.1rem] text-[#ccc]"

const hofInducted = "text-[#ffd700] font-bold uppercase tracking-[1px]"

const hofProgress = "text-[#4a90e2]"

const skeletonSweep =
    "bg-[linear-gradient(90deg,#2a2a2a_25%,#3a3a3a_50%,#2a2a2a_75%)] bg-[length:200%_100%] " +
    "animate-skeleton-sweep"

const skeletonAvatar =
    skeletonSweep +
    " rounded-[12px] h-[580px] w-[580px] " +
    "upto-lg:h-[350px] upto-lg:w-[350px] upto-sm:h-[250px] upto-sm:w-[250px]"

const skeletonPlayerName =
    skeletonSweep +
    " rounded-[8px] h-[3.5rem] w-[300px] mb-[1rem] " +
    "upto-lg:w-[250px] upto-lg:h-[2.5rem] upto-sm:w-[200px] upto-sm:h-[2rem]"

const skeletonPlayerMeta = "flex flex-col gap-[0.5rem]"

const skeletonMetaItem =
    skeletonSweep +
    " rounded-[4px] h-[1.5rem] w-[250px] upto-lg:w-[200px] upto-sm:w-[180px]"

const skeletonSeasonSelect =
    skeletonSweep +
    " rounded-[8px] h-[4rem] w-[300px] mb-[1.5rem] upto-sm:w-[250px]"

const skeletonCategoryTitle =
    skeletonSweep + " rounded-[8px] h-[2rem] w-[200px] mb-[1rem]"

const skeletonStatGrid =
    "grid grid-cols-[repeat(7,1fr)] gap-0 bg-[#262626] rounded-[8px] overflow-hidden " +
    "w-full min-h-[150px]"

const skeletonStatItem =
    skeletonSweep +
    " p-[1rem] text-center border-r border-r-[#262626] border-b border-b-[#262626] min-h-[3rem]"

const skeletonSectionTitle =
    skeletonSweep + " rounded-[8px] h-[2rem] w-[150px] mb-[1rem]"

const skeletonList = "flex flex-wrap gap-[1rem] min-h-[100px]"

const skeletonTeamOrGameItem =
    skeletonSweep + " rounded-[6px] h-[2.5rem] w-[150px]"

const skeletonAwardItem =
    skeletonSweep + " rounded-[6px] h-[120px] w-[200px]"

const skeletonHofProgress =
    skeletonSweep + " rounded-[8px] h-[100px] w-full"

const awardIcons: { [key: string]: any } = {
    "MVP": faTrophy,
    "Best Spiker": faVolleyballBall,
    "Best Setter": faHandSparkles,
    "Best Libero": faShieldAlt,
    "Best Server": faCrosshairs,
    "Best Blocker": faLock,
    "Best Aper": faBolt,
    "Best Receiver": faUserShield,
    "DPOS": faShield,
    "FMVP": faCrown,
    "MIP": faMedal,
    "LuvLate Award": faAward,
    "Rings": faRing,
}

const calculateChampionships = (player: any): number => {
    if (!player.teams) return 0;
    
    return player.teams.reduce((total: number, team: any) => {
        if (team.placement && (
            team.placement === '1st Place' ||
            team.placement === '1st Place (D1)' ||
            team.placement === '1st Place (D2)' ||
            team.placement === '1st Place (D3)'
        )) {
            return total + 1;
        }
        return total;
    }, 0);
};

const calculateHOFScore = (player: any, awards: any[], careerTotals: any): number => {
    let score = 0;
    
    // Award points
    if (awards) {
        awards.forEach(award => {
            switch(award.type) {
                case 'MVP':
                    score += 50;
                    break;
                case 'Best Spiker':
                case 'Best Blocker':
                    score += 35;
                    break;
                case 'Best Aper':
                case 'Best Receiver':
                case 'Best Setter':
                case 'FMVP':
                case 'LuvLate Award':
                    score += 25;
                    break;
                case 'Best Server':
                case 'MIP':
                case 'Best Libero':
                case 'DPOS':
                    score += 15;
                    break;
                default:
                    score += 5;
            }
        });
    }

    // Stats points
    if (careerTotals) {
        // Spike Kills tiers
        if (careerTotals.spikeKills >= 500) score += 15;
        else if (careerTotals.spikeKills >= 300) score += 10;
        else if (careerTotals.spikeKills >= 100) score += 5;

        // Blocks tiers
        if (careerTotals.blocks >= 200) score += 15;
        else if (careerTotals.blocks >= 100) score += 10;
        else if (careerTotals.blocks >= 50) score += 5;

        // Assists tiers
        if (careerTotals.assists >= 500) score += 15;
        else if (careerTotals.assists >= 300) score += 10;
        else if (careerTotals.assists >= 100) score += 5;

        // Digs tiers
        if (careerTotals.digs >= 500) score += 15;
        else if (careerTotals.digs >= 300) score += 10;
        else if (careerTotals.digs >= 100) score += 5;

        // Aces tiers
        if (careerTotals.aces >= 20) score += 15;
        else if (careerTotals.aces >= 10) score += 10;
        else if (careerTotals.aces >= 5) score += 5;

        // Games played tiers
        if (careerTotals.gamesPlayed >= 100) score += 15;
        else if (careerTotals.gamesPlayed >= 50) score += 10;
        else if (careerTotals.gamesPlayed >= 20) score += 5;
    }

    // Team placement points
    if (player.teams) {
        player.teams.forEach((team: { placement?: string }) => {
            if (team.placement) {
                switch(team.placement) {
                    case 'G.O.A.T.':
                        score = Infinity; // Instant Hall of Fame induction
                        break;
                    case '1st Place':
                        score += 20;
                        break;
                    case '1st Place (D1)':
                        score += 20;
                        break;
                    case '1st Place (D2)':
                        score += 18;
                        break;
                    case '1st Place (D3)':
                        score += 15;
                        break;
                    case '2nd Place (D1)':
                        score += 15;
                        break;
                    case '2nd Place (D2)':
                        score += 13;
                        break;
                    case '2nd Place (D3)':
                        score += 10;
                        break;
                    case '2nd Place':
                        score += 15;
                        break;
                    case '3rd Place (D1)':
                        score += 10;
                        break;
                    case '3rd Place (D2)':
                        score += 8;
                        break;
                    case '3rd Place (D3)':
                        score += 5;
                        break;
                    case '3rd Place':
                        score += 10;
                        break;
                    case '4th Place (D1)':
                        score += 5;
                        break;
                    case '4th Place (D2)':
                        score += 4;
                        break;
                    case '4th Place (D3)':
                        score += 3;
                        break;
                    case '4th Place':
                        score += 5;
                        break;
                    case 'Top 6 (D1)':
                        score += 3;
                        break;
                    case 'Top 6 (D2)':
                        score += 2;
                        break;
                    case 'Top 6 (D3)':
                        score += 1;
                        break;
                    case 'Top 6':
                        score += 3;
                        break;
                    case 'Top 8 (D1)':
                        score += 1;
                        break;
                    case 'Top 8 (D2)':
                        score += 0.5;
                        break;
                    case 'Top 8 (D3)':
                        score += 0.25;
                        break;
                    case 'Top 8':
                        score += 1;
                        break;
                }
            }
        });
    }



    // Teams played for points
    const teamsPlayed = player.teams?.length || 0;
    if (teamsPlayed >= 3 && teamsPlayed <= 6) {
        score += 5;
    } else if (teamsPlayed > 6 && teamsPlayed <= 10) {
        score += 10;
    } else if (teamsPlayed > 10 && teamsPlayed <= 12) {
        score += 15;
    } else if (teamsPlayed > 12 && teamsPlayed <= 14) {
        score += 20;
    }

    return score; // Removed the Math.min cap
};

const PlayerProfiles: React.FC = () =>
{
    const { id } = useParams<{ id: string }>()
    const { regions } = useRegion()
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [profileRegion, setProfileRegion] = useState<'all' | RegionCode>('all')
    const regionFilter = profileRegion === 'all' ? undefined : profileRegion
    const { data, error, loading } = useSinglePlayer(id || "", regionFilter)
    const [selectedSeason, setSelectedSeason] = useState<number>(0)
    const [showAllGames, setShowAllGames] = useState<boolean>(false)
    const { data: awards, loading: awardsLoading, error: awardsError } = useAwardsByPlayerID(id || "", regionFilter)

    useEffect(() =>
    {
        if (data?.name)
        {
            getRobloxAvatarUrl(data.name)
                .then(url => { if (url) setAvatarUrl(url) })
                .catch(err => console.error("Error fetching avatar:", err))
        }
    }, [data?.name])

    if (!id) return <div className={playerProfileContainer}>URL ID is undefined</div>
    
    // Loading state with skeleton
    if (loading) {
        return (
            <div className={playerProfileContainerLoading}>
                <div className={playerMainHeaderLoading}>
                    <div className={avatarHeaderInfoLoading}>
                        <div className={avatarLeft}>
                            <div className={skeletonAvatar}></div>
                        </div>
                        <div className={avatarRight}>
                            <div className={skeletonPlayerName}></div>
                            <div className={skeletonPlayerMeta}>
                                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                    <div key={i} className={skeletonMetaItem}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className={skeletonSeasonSelect}></div>
                
                <div className={playerProfilesGridLoading}>
                    <div className={playerCardLoading}>
                        <div className={playerStatsLoading}>
                            <div>
                                <div className={skeletonCategoryTitle}></div>
                                <div className={skeletonStatGrid}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(i => (
                                        <div key={i} className={skeletonStatItem}></div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className={skeletonCategoryTitle}></div>
                                <div className={skeletonStatGrid}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(i => (
                                        <div key={i} className={skeletonStatItem}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className={playerSectionLoading}>
                    <div className={skeletonSectionTitle}></div>
                    <div className={skeletonList}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={skeletonTeamOrGameItem}></div>
                        ))}
                    </div>
                </div>
                
                <div className={playerSectionLoading}>
                    <div className={skeletonSectionTitle}></div>
                    <div className={skeletonList}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={skeletonTeamOrGameItem}></div>
                        ))}
                    </div>
                </div>
                
                <div className={playerSectionLoading}>
                    <div className={skeletonSectionTitle}></div>
                    <div className={skeletonList}>
                        {[1, 2, 3].map(i => (
                            <div key={i} className={skeletonAwardItem}></div>
                        ))}
                    </div>
                </div>
                
                <div className={playerHofSectionLoading}>
                    <div className={skeletonSectionTitle}></div>
                    <div className={skeletonHofProgress}></div>
                </div>
            </div>
        );
    }
    
    if (error) return <div className={playerProfileContainer}>Error: {error}</div>
    if (!data) return <div className={playerProfileContainer}>No player found.</div>

    const player = data
    const allStats = Array.isArray(player.stats) ? player.stats : []

    const uniqueSeasons = Array.from(
        new Set(
            allStats
                .map(stat => stat.game?.season?.seasonNumber)
                .filter((num): num is number => typeof num === "number")
        )
    ).sort((a, b) => a - b)

    const filteredStats = selectedSeason === 0
        ? allStats
        : allStats.filter(stat => stat.game?.season?.seasonNumber === selectedSeason)

    const careerTotals = filteredStats.reduce((acc, stat) => ({
        spikeKills: acc.spikeKills + stat.spikeKills,
        spikeAttempts: acc.spikeAttempts + stat.spikeAttempts,
        apeKills: acc.apeKills + stat.apeKills,
        apeAttempts: acc.apeAttempts + stat.apeAttempts,
        spikingErrors: acc.spikingErrors + stat.spikingErrors,
        digs: acc.digs + stat.digs,
        blocks: acc.blocks + stat.blocks,
        assists: acc.assists + stat.assists,
        aces: acc.aces + stat.aces,
        settingErrors: acc.settingErrors + stat.settingErrors,
        blockFollows: acc.blockFollows + stat.blockFollows,
        servingErrors: acc.servingErrors + stat.servingErrors,
        miscErrors: acc.miscErrors + stat.miscErrors,
        gamesPlayed: acc.gamesPlayed + 1
    }), {
        spikeKills: 0,
        spikeAttempts: 0,
        apeKills: 0,
        apeAttempts: 0,
        spikingErrors: 0,
        digs: 0,
        blocks: 0,
        assists: 0,
        aces: 0,
        settingErrors: 0,
        blockFollows: 0,
        servingErrors: 0,
        miscErrors: 0,
        gamesPlayed: 0
    })

    const averages = {
        spikeKills: careerTotals.gamesPlayed ? (careerTotals.spikeKills / careerTotals.gamesPlayed).toFixed(1) : "0",
        spikeAttempts: careerTotals.gamesPlayed ? (careerTotals.spikeAttempts / careerTotals.gamesPlayed).toFixed(1) : "0",
        apeKills: careerTotals.gamesPlayed ? (careerTotals.apeKills / careerTotals.gamesPlayed).toFixed(1) : "0",
        apeAttempts: careerTotals.gamesPlayed ? (careerTotals.apeAttempts / careerTotals.gamesPlayed).toFixed(1) : "0",
        spikingErrors: careerTotals.gamesPlayed ? (careerTotals.spikingErrors / careerTotals.gamesPlayed).toFixed(1) : "0",
        digs: careerTotals.gamesPlayed ? (careerTotals.digs / careerTotals.gamesPlayed).toFixed(1) : "0",
        blocks: careerTotals.gamesPlayed ? (careerTotals.blocks / careerTotals.gamesPlayed).toFixed(1) : "0",
        assists: careerTotals.gamesPlayed ? (careerTotals.assists / careerTotals.gamesPlayed).toFixed(1) : "0",
        aces: careerTotals.gamesPlayed ? (careerTotals.aces / careerTotals.gamesPlayed).toFixed(1) : "0",
        settingErrors: careerTotals.gamesPlayed ? (careerTotals.settingErrors / careerTotals.gamesPlayed).toFixed(1) : "0",
        blockFollows: careerTotals.gamesPlayed ? (careerTotals.blockFollows / careerTotals.gamesPlayed).toFixed(1) : "0",
        servingErrors: careerTotals.gamesPlayed ? (careerTotals.servingErrors / careerTotals.gamesPlayed).toFixed(1) : "0",
        miscErrorsPerGame: careerTotals.gamesPlayed ? (careerTotals.miscErrors / careerTotals.gamesPlayed).toFixed(1) : "0"
    }

    const currentSeasonTeam = player.teams?.find(team => team.season?.seasonNumber === 14)?.name || "Not Active"
    const mostRecentTeam = player.teams?.reduce((mostRecent, team) =>
    {
        if (!team.season) return mostRecent
        if (!mostRecent || team.season.id > mostRecent.season.id) return team
        return mostRecent
    }, null as typeof player.teams[0] | null)?.name || "N/A"

    const seenGames = new Set<number>()
    const dedupedGames = player.teams?.flatMap(team => team.games || []).filter(game =>
    {
        if (seenGames.has(game.id)) return false
        seenGames.add(game.id)
        return true
    }) || []

    const visibleGamesList = showAllGames ? dedupedGames : dedupedGames.slice(0, 5)
    const hasMoreGames = dedupedGames.length > 5

    const handleToggleGames = () => {
        setShowAllGames(prev => !prev)
    }

    const formatStatName = (key: string): string => {
        const nameMap: { [key: string]: string } = {
            spikeKills: "Spike Kills",
            spikeAttempts: "Spike Attempts",
            apeKills: "Ape Kills",
            apeAttempts: "Ape Attempts",
            spikingErrors: "Spiking Errors",
            digs: "Digs",
            blocks: "Blocks",
            assists: "Assists",
            aces: "Aces",
            settingErrors: "Setting Errors",
            blockFollows: "Block Follows",
            servingErrors: "Serving Errors",
            miscErrors: "Misc Errors",
            gamesPlayed: "Games Played",
            miscErrorsPerGame: "Misc Errors Per Game"
        }
        return nameMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    }

    const hofScore = calculateHOFScore(player, awards || [], careerTotals)
    const isGOAT = hofScore === Infinity
    const hofPercentage = isGOAT ? 100 : Math.min((hofScore / 100) * 100, 100); // Cap percentage at 100 for display

    return (
        <div className={playerProfileContainer}>
            {/* SEO Meta Tags for Social Media Embedding */}
            {player && (
                <SEO
                    title={`${player.name} - Player Profile`}
                    description={`${player.name} is a ${player.position} in the Roblox Volleyball League. View stats, teams, awards, and career highlights.`}
                    image={avatarUrl || "https://volleyball4-2.com/rvlLogo.png"}
                    url={`https://volleyball4-2.com/players/${player.id}`}
                    type="profile"
                    structuredData={{
                        "@context": "https://schema.org",
                        "@type": "Person",
                        "name": player.name,
                        "jobTitle": player.position,
                        "description": `${player.name} is a ${player.position} in the Roblox Volleyball League`,
                        "image": avatarUrl || "https://volleyball4-2.com/rvlLogo.png",
                        "url": `https://volleyball4-2.com/players/${player.id}`,
                        "worksFor": {
                            "@type": "Organization",
                            "name": "Roblox Volleyball League",
                            "url": "https://volleyball4-2.com"
                        },
                        "knowsAbout": ["Volleyball", "Gaming", "Sports"],
                        "alumniOf": player.teams?.map(team => ({
                            "@type": "SportsTeam",
                            "name": team.name,
                            "url": `https://volleyball4-2.com/teams/${encodeURIComponent(team.name.toLowerCase().replace(/\s+/g, "-"))}`
                        })) || []
                    }}
                />
            )}

            <div className={playerMainHeader}>
                <div className={avatarHeaderInfo}>
                    {avatarUrl && (
                        <div className={avatarLeft}>
                            <img src={avatarUrl} alt={`${player.name}'s avatar`} className={playerAvatar} />
                        </div>
                    )}
                    <div className={avatarRight}>
                        <h1 className={playerNameLarge}>{player.name}</h1>
                        <div className={playerMeta}>
                            <span>Username: {player.name}</span>
                            <span>Position: {player.position}</span>
                            <span>Current Team: {currentSeasonTeam}</span>
                            <span>Most Recent Team: {mostRecentTeam}</span>
                            <span>Total Teams: {player.teams?.length || 0}</span>
                            <span>Possible Games Played: {dedupedGames.length}</span>
                            <span>Total Stat Entries: {filteredStats.length}</span>
                            
                        </div>
                    </div>
                </div>
            </div>

            <div className="player-region-tabs" style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                <button
                    type="button"
                    className={profileRegion === 'all' ? 'active' : ''}
                    onClick={() => setProfileRegion('all')}
                >
                    All Regions
                </button>
                {regions.map((region) => (
                    <button
                        key={region.id}
                        type="button"
                        className={profileRegion === region.code ? 'active' : ''}
                        onClick={() => setProfileRegion(region.code)}
                    >
                        {region.name}
                    </button>
                ))}
            </div>

            <div style={{ marginBottom: "1.5rem", maxWidth: "300px" }}>
                <label htmlFor="season-select" style={{ color: "#ccc", marginBottom: "0.5rem", display: "block" }}>
                    View stats for:
                </label>
                <Select
                    id="season-select"
                    value={{ value: selectedSeason, label: selectedSeason === 0 ? "Career" : `Season ${selectedSeason}` }}
                    onChange={(option) => setSelectedSeason(option?.value || 0)}
                    options={[
                        { value: 0, label: "Career" },
                        ...uniqueSeasons.map(season => ({ value: season, label: `Season ${season}` }))
                    ]}
                    styles={{
                        control: (base) => ({
                            ...base,
                            backgroundColor: "#1a1a1a",
                            borderColor: "#333",
                            color: "#fff",
                            boxShadow: "none"
                        }),
                        singleValue: (base) => ({
                            ...base,
                            color: "#fff"
                        }),
                        menu: (base) => ({
                            ...base,
                            backgroundColor: "#1a1a1a",
                            color: "#fff"
                        }),
                        option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused ? "var(--color-brand-primary-hover)" : "#1a1a1a",
                            color: "#fff",
                            cursor: "pointer"
                        }),
                    }}
                />
            </div>

            {filteredStats.length === 0 ? (
                <p>No stats available for this season.</p>
            ) : (
                <div className={playerProfilesGrid}>
                    <div className={playerCard}>
                        <div className={playerStats}>
                            <div>
                                <h3 className={statCategoryH3}>{selectedSeason === 0 ? "Career Totals" : `Season ${selectedSeason} Totals`}</h3>
                                <div className={statGrid}>
                                    {Object.entries(careerTotals).map(([label, value]) => (
                                        <div key={label} className={statItem}>
                                            <span className={statLabel}>{formatStatName(label)}</span>
                                            <span className={statValue}>{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className={statCategoryH3}>Per Game Averages</h3>
                                <div className={statGrid}>
                                    {Object.entries(averages).map(([label, value]) => (
                                        <div key={label} className={statItem}>
                                            <span className={statLabel}>{formatStatName(label)}</span>
                                            <span className={statValue}>{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className={playerSection}>
                <h3 className={playerSectionH3}>Teams</h3>
                {!player.teams || player.teams.length === 0 ? (
                    <p className={playerSectionP}>No teams found.</p>
                ) : (
                    <ul className={teamList}>
                        {player.teams.map(team => (
                            <li key={team.id} className={teamListItem}>
                                <a
                                    href={`/teams/${encodeURIComponent(team.name.toLowerCase().replace(/\s+/g, "-"))}`}
                                    className={teamListLink}
                                >
                                    {team.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className={playerSection}>
                <h3 className={playerSectionH3}>Games Played</h3>
                {dedupedGames.length === 0 ? (
                    <p className={playerSectionP}>No games found.</p>
                ) : (
                    <>
                        <ul className={showAllGames ? gameListExpanded : gameList}>
                            {visibleGamesList.map(game => (
                                <li key={game.id}>
                                    <a href={`/games/${game.id}`} className={gameListLink}>{game.name}</a>
                                </li>
                            ))}
                        </ul>
                        {hasMoreGames && (
                            <button 
                                className={showMoreGames}
                                onClick={handleToggleGames}
                            >
                                {showAllGames ? 'Show Less' : 'See More Games'}
                            </button>
                        )}
                    </>
                )}
            </div>

            <div className={playerSection}>
                <h3 className={playerSectionH3}>Awards</h3>
                {awardsLoading ? (
                    <p className={playerSectionP}>Loading awards...</p>
                ) : awardsError ? (
                    <p className={playerSectionP}>Error loading awards</p>
                ) : (
                    <>
                        {/* Display all awards in one list */}
                        {(awards && awards.length > 0) || calculateChampionships(player) > 0 ? (
                            <ul className={playerProfileAwardsList}>
                                {/* Rings award first if player has championships */}
                                {(() => {
                                    const championships = calculateChampionships(player);
                                    if (championships > 0) {
                                        return (
                                            <li className={playerProfileAwardItem}>
                                                <div className={playerProfileAwardContent}>
                                                    <div className={ringsDisplay}>
                                                        {championships === 1 && (
                                                            <FontAwesomeIcon 
                                                                icon={faRing} 
                                                                className={championshipRingSingle}
                                                            />
                                                        )}
                                                        {championships === 2 && (
                                                            <>
                                                                <FontAwesomeIcon 
                                                                    icon={faRing} 
                                                                    className={championshipRingLeft}
                                                                />
                                                                <FontAwesomeIcon 
                                                                    icon={faRing} 
                                                                    className={championshipRingRight}
                                                                />
                                                            </>
                                                        )}
                                                        {championships >= 3 && (
                                                            <>
                                                                <FontAwesomeIcon 
                                                                    icon={faRing} 
                                                                    className={championshipRingLeft}
                                                                />
                                                                <FontAwesomeIcon 
                                                                    icon={faRing} 
                                                                    className={championshipRingCenter}
                                                                />
                                                                <FontAwesomeIcon 
                                                                    icon={faRing} 
                                                                    className={championshipRingRight}
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                    <span className={playerProfileAwardType}>Rings</span>
                                                    <span className={playerProfileAwardSeason}>{championships} Championship{championships > 1 ? 's' : ''}</span>
                                                </div>
                                            </li>
                                        );
                                    }
                                    return null;
                                })()}
                                
                                {/* Existing awards */}
                                {awards && awards.map((award) => (
                                    <li key={award.id} className={playerProfileAwardItem}>
                                        <a href={`/awards/${award.id}`} className={playerProfileAwardLink}>
                                            <div className={playerProfileAwardContent}>
                                                <FontAwesomeIcon 
                                                    icon={awardIcons[award.type] || faTrophy} 
                                                    className={playerProfileAwardIcon}
                                                />
                                                <span className={playerProfileAwardType}>{award.type}</span>
                                                <span className={playerProfileAwardSeason}>Season {award.season.seasonNumber}</span>
                                            </div>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                        
                        {/* Show "No awards yet" only if no awards and no rings */}
                        {(!awards || awards.length === 0) && calculateChampionships(player) === 0 && (
                            <p className={playerSectionP}>No awards yet.</p>
                        )}
                    </>
                )}
            </div>

            <div className={isGOAT ? playerHofSectionGoat : playerHofSection}>
                <h3 className={playerSectionH3}>Hall of Fame Progress</h3>
                <div className={hofProgressContainer}>
                    <div className={hofScoreRow}>
                        {!isGOAT && <FontAwesomeIcon icon={faStar} className={hofIcon} />}
                        <span className={isGOAT ? hofScoreValueGoat : hofScoreValue}>
                            {isGOAT ? '∞' : hofScore}
                        </span>
                        {isGOAT && <FontAwesomeIcon icon={faStar} className={hofIcon} />}
                        <span className={hofScoreMax}>
                            {isGOAT ? '' : '/100'}
                        </span>
                    </div>
                    <div className={hofProgressBar}>
                        <div 
                            className={isGOAT ? hofProgressFillGoat : hofProgressFill}
                            style={{ width: `${hofPercentage}%` }}
                        />
                    </div>
                    <div className={hofStatus}>
                        {isGOAT ? (
                            <span className={hofInducted}>G.O.A.T. - Hall of Fame Inducted!</span>
                        ) : hofScore >= 100 ? (
                            <span className={hofInducted}>Hall of Fame Inducted! (+{hofScore - 100} points)</span>
                        ) : (
                            <span className={hofProgress}>{Math.round(hofPercentage)}% to Hall of Fame</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PlayerProfiles
