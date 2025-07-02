//  html2canvas converts the off-screen card into a PNG
import html2canvas from 'html2canvas';

/*───────────────────────────────────────────────────────────────*
 *  Data Contract                                                *
 *───────────────────────────────────────────────────────────────*/
export interface PlayerCardData
{
    //  Root player object from API
    player: any;

    //  Season-total raw stats
    seasonStats: any;

    //  Per-game seasonal averages
    seasonAverages: any;

    //  Array of award objects
    awards: any[];

    //  Full-body Roblox avatar URL
    avatarUrl?: string;

    //  Season number (0 == career)
    seasonNumber: number;
}

/*───────────────────────────────────────────────────────────────*
 *  Calculate NBA-Style "Overall" (50 – 99)                      *
 *───────────────────────────────────────────────────────────────*/
const calculateOverall = (
    stats: any,
    averages: any,
    awards: any[],
    gamesPlayed: number
): number =>
{
    //  Base rating
    let overall = 50;

    //  Add stat-based contribution
    if (gamesPlayed > 0)
    {
        //  Offensive score
        const offensive =
            (
                (parseFloat(averages.spikeKills)   * 3) +
                (parseFloat(averages.apeKills)     * 2) +
                (parseFloat(averages.aces)         * 4) +
                (parseFloat(averages.assists)      * 2)
            ) / 10;

        //  Defensive score
        const defensive =
            (
                (parseFloat(averages.digs)         * 3) +
                (parseFloat(averages.blocks)       * 4) +
                (parseFloat(averages.blockFollows) * 2)
            ) / 9;

        //  Efficiency score (errors penalise)
        const efficiency = Math.max
        (
            0,
            10 -
            (
                (parseFloat(averages.spikingErrors)   * 2) +
                (parseFloat(averages.settingErrors)   * 2) +
                (parseFloat(averages.servingErrors)   * 2) +
                (parseFloat(averages.miscErrorsPerGame))
            )
        );

        //  Volume bonus for games played
        const volumeBonus = Math.min(10, gamesPlayed / 5);

        //  Aggregate into overall
        overall +=
            (offensive    * 0.4) +
            (defensive    * 0.3) +
            (efficiency   * 0.2) +
            (volumeBonus  * 0.1);
    }

    //  Add award-based bumps
    awards?.forEach((aw) =>
    {
        switch (aw.type)
        {
            case 'MVP':                   overall += 8; break;
            case 'FMVP':                  overall += 7; break;
            case 'Best Spiker':
            case 'Best Blocker':          overall += 5; break;
            case 'Best Setter':
            case 'Best Libero':
            case 'Best Server':
            case 'Best Receiver':
            case 'Best Aper':             overall += 4; break;
            case 'MIP':
            case 'DPOS':
            case 'LuvLate Award':         overall += 3; break;
            default:                      overall += 2;
        }
    });

    //  Clamp to 50 – 99
    return Math.min(99, Math.max(50, Math.round(overall)));
};

/*───────────────────────────────────────────────────────────────*
 *  Award → Icon (Emoji placeholders)                            *
 *───────────────────────────────────────────────────────────────*/
const awardIconMap: Record<string, string> =
{
    MVP:               '🏆',
    FMVP:              '👑',
    'Best Spiker':     '💥',
    'Best Blocker':    '🛡️',
    'Best Setter':     '🤲',
    'Best Libero':     '🦸',
    'Best Server':     '🎯',
    'Best Receiver':   '📥',
    'Best Aper':       '⚡',
    MIP:               '🌟',
    DPOS:              '🛡️',
    'LuvLate Award':   '💖'
};

/*───────────────────────────────────────────────────────────────*
 *  Generator – Builds DOM → Renders PNG                          *
 *───────────────────────────────────────────────────────────────*/
export const generatePlayerCard = async (data: PlayerCardData): Promise<string> =>
{
    //  Compute overall rating once
    const overall = calculateOverall
    (
        data.seasonStats,
        data.seasonAverages,
        data.awards,
        data.seasonStats.gamesPlayed
    );

    //  Resolve team name for chosen season
    const teamName = data.player?.teams?.length
        ? (
            data.seasonNumber === 0
                ? data.player.teams.at(-1).name
                : (
                    data.player.teams.find(
                        (t: any) => t.season?.seasonNumber === data.seasonNumber
                    )?.name ?? ''
                )
        )
        : '';

    //  Map awards → icons array
    const awardIcons = (data.awards ?? []).map(
        (a) => awardIconMap[a.type] ?? '🏅'
    );

    //  Create detailed stats sections for back card
    const offensiveStats = [
        { label: 'Spike Kills', value: data.seasonStats.spikeKills, avg: data.seasonAverages.spikeKills },
        { label: 'Spike Attempts', value: data.seasonStats.spikeAttempts, avg: data.seasonAverages.spikeAttempts },
        { label: 'Ape Kills', value: data.seasonStats.apeKills, avg: data.seasonAverages.apeKills },
        { label: 'Ape Attempts', value: data.seasonStats.apeAttempts, avg: data.seasonAverages.apeAttempts },
        { label: 'Aces', value: data.seasonStats.aces, avg: data.seasonAverages.aces },
        { label: 'Assists', value: data.seasonStats.assists, avg: data.seasonAverages.assists },
    ];

    const defensiveStats = [
        { label: 'Digs', value: data.seasonStats.digs, avg: data.seasonAverages.digs },
        { label: 'Blocks', value: data.seasonStats.blocks, avg: data.seasonAverages.blocks },
        { label: 'Block Follows', value: data.seasonStats.blockFollows, avg: data.seasonAverages.blockFollows },
    ];

    const errorStats = [
        { label: 'Spiking Errors', value: data.seasonStats.spikingErrors, avg: data.seasonAverages.spikingErrors },
        { label: 'Setting Errors', value: data.seasonStats.settingErrors, avg: data.seasonAverages.settingErrors },
        { label: 'Serving Errors', value: data.seasonStats.servingErrors, avg: data.seasonAverages.servingErrors },
        { label: 'Misc Errors', value: data.seasonStats.miscErrors, avg: data.seasonAverages.miscErrorsPerGame },
    ];

    //  Create off-screen container for both cards
    const container = document.createElement('div');
    container.style.position     = 'absolute';
    container.style.left         = '-9999px';
    container.style.top          = '0';
    container.style.width        = '1100px';
    container.style.height       = '700px';
    container.style.display      = 'flex';
    container.style.gap          = '20px';
    container.style.background   = 'transparent';
    container.style.overflow     = 'visible';

    //  Build both cards in a single container
    container.innerHTML = `
        <!-- Front Card -->
        <div style="
            width: 500px;
            height: 700px;
            background: linear-gradient(135deg,#141e30 0%,#243b55 50%,#141e30 100%);
            color: #ffffff;
            font-family: 'Oswald','Segoe UI',Tahoma,Geneva,Verdana,sans-serif;
            border-radius: 24px;
            box-shadow: 0 14px 28px rgba(0,0,0,0.45);
            overflow: hidden;
            position: relative;
        ">
            <style>
                @keyframes holoShift
                {
                    0%  { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100%{ background-position: 0% 50%; }
                }

                .overallRating
                {
                    font-size: 4.2rem;
                    font-weight: 900;
                    line-height: 1;
                    text-shadow: 2px 2px 8px rgba(0,0,0,0.4);
                }

                .overallRating.holo
                {
                    background: linear-gradient(
                        60deg,
                        #ffca00,
                        #ff006a,
                        #a864ff,
                        #00eaff,
                        #ffca00
                    );
                    background-size: 400% 400%;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: holoShift 6s ease infinite;
                }
            </style>

            <!--  Overall rating number (holographic if ≥ 97)  -->
            <div
                class="overallRating${overall >= 97 ? ' holo' : ''}"
                style="
                    position: absolute;
                    top: 22px;
                    left: 30px;
                    z-index: 4;
                "
            >
                ${overall}
            </div>

            <!--  Vertical award rail  -->
            ${awardIcons.length
                ? `
                  <div
                      style="
                          position: absolute;
                          top: 135px;
                          right: 20px;
                          width: 50px;
                          display: flex;
                          flex-direction: column;
                          align-items: center;
                          gap: 20px;
                          z-index: 4;
                      "
                  >
                      ${awardIcons
                          .map(
                              (ic) =>
                                  `<span style="font-size:2rem;filter:drop-shadow(0 2px 4px #000a);">${ic}</span>`
                          )
                          .join('')}
                  </div>`
                : ''}

            <!--  Avatar wrapper  -->
            <div
                style="
                    position: absolute;
                    bottom: -120px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 480px;
                    height: 550px;
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                    pointer-events: none;
                    z-index: 2;
                "
            >
                ${data.avatarUrl
                    ? `
                      <img
                          src="${data.avatarUrl}"
                          alt="avatar"
                          style="
                              width: 100%;
                              height: 100%;
                              object-fit: contain;
                              object-position: bottom;
                              transform: scale(1.6);
                              transform-origin: center bottom;
                              filter: drop-shadow(0 10px 24px rgba(0,0,0,0.6));
                          "
                      />`
                    : ''}
            </div>

            <!--  Player name  -->
            <div
                style="
                    position: absolute;
                    bottom: 115px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 90%;
                    text-align: center;
                    font-size: 2.4rem;
                    font-weight: 900;
                    letter-spacing: 1.5px;
                    text-shadow: 2px 2px 6px rgba(0,0,0,0.6);
                    z-index: 3;
                "
            >
                ${data.player.name}
            </div>

            <!--  Team name  -->
            ${teamName
                ? `
                  <div
                      style="
                          position: absolute;
                          bottom: 80px;
                          left: 50%;
                          transform: translateX(-50%);
                          width: 92%;
                          text-align: center;
                          font-size: 1.6rem;
                          font-weight: 700;
                          letter-spacing: 1px;
                          color: #ffffff;
                          text-shadow: 1px 1px 3px rgba(0,0,0,0.6);
                          border-bottom: 2px solid rgba(255,255,255,0.25);
                          padding-bottom: 4px;
                          z-index: 3;
                      "
                  >
                      ${teamName}
                  </div>`
                : ''}

            <!--  Footer brand  -->
            <div
                style="
                    position: absolute;
                    bottom: 20px;
                    left: 0;
                    width: 100%;
                    text-align: center;
                    font-size: 1rem;
                    font-weight: 600;
                    opacity: 0.75;
                    letter-spacing: 1px;
                "
            >
                Roblox Volleyball League
            </div>
        </div>

        <!-- Back Card -->
        <div style="
            width: 500px;
            height: 700px;
            background: linear-gradient(135deg,#141e30 0%,#243b55 50%,#141e30 100%);
            color: #ffffff;
            font-family: 'Oswald','Segoe UI',Tahoma,Geneva,Verdana,sans-serif;
            border-radius: 24px;
            box-shadow: 0 14px 28px rgba(0,0,0,0.45);
            overflow: hidden;
            position: relative;
        ">
            <!-- Header -->
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 80px;
                background: linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
                border-bottom: 2px solid rgba(255,255,255,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2;
            ">
                <div style="text-align: center;">
                    <div style="font-size: 1.8rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">
                        ${data.player.name}
                    </div>
                    <div style="font-size: 1rem; font-weight: 600; opacity: 0.8; margin-top: 4px;">
                        ${teamName} • Season ${data.seasonNumber === 0 ? 'Career' : data.seasonNumber}
                    </div>
                </div>
            </div>

            <!-- Season Summary -->
            <div style="
                position: absolute;
                top: 100px;
                left: 20px;
                right: 20px;
                background: rgba(255,255,255,0.1);
                border-radius: 12px;
                padding: 15px;
                z-index: 2;
            ">
                <div style="font-size: 1.2rem; font-weight: 700; margin-bottom: 10px; text-transform: uppercase;">
                    Season Summary
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; font-weight: 900; color: #4a90e2;">${data.seasonStats.gamesPlayed}</div>
                        <div style="font-size: 0.8rem; opacity: 0.8;">Games Played</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; font-weight: 900; color: #50c878;">${data.seasonStats.spikeKills + data.seasonStats.apeKills}</div>
                        <div style="font-size: 0.8rem; opacity: 0.8;">Total Kills</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; font-weight: 900; color: #ff6b6b;">${data.seasonStats.spikingErrors + data.seasonStats.settingErrors + data.seasonStats.servingErrors}</div>
                        <div style="font-size: 0.8rem; opacity: 0.8;">Total Errors</div>
                    </div>
                </div>
            </div>

            <!-- Offensive Stats -->
            <div style="
                position: absolute;
                top: 220px;
                left: 20px;
                right: 20px;
                background: rgba(255,255,255,0.1);
                border-radius: 12px;
                padding: 15px;
                z-index: 2;
            ">
                <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 10px; color: #4a90e2; text-transform: uppercase;">
                    Offensive Stats
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    ${offensiveStats.map(stat => `
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            padding: 6px 0;
                            border-bottom: 1px solid rgba(255,255,255,0.1);
                        ">
                            <span style="font-size: 0.85rem; opacity: 0.9;">${stat.label}</span>
                            <div style="text-align: right;">
                                <div style="font-size: 1rem; font-weight: 700;">${stat.value}</div>
                                <div style="font-size: 0.7rem; opacity: 0.6;">${stat.avg}/gm</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Defensive Stats -->
            <div style="
                position: absolute;
                top: 380px;
                left: 20px;
                right: 20px;
                background: rgba(255,255,255,0.1);
                border-radius: 12px;
                padding: 15px;
                z-index: 2;
            ">
                <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 10px; color: #50c878; text-transform: uppercase;">
                    Defensive Stats
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    ${defensiveStats.map(stat => `
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            padding: 6px 0;
                            border-bottom: 1px solid rgba(255,255,255,0.1);
                        ">
                            <span style="font-size: 0.85rem; opacity: 0.9;">${stat.label}</span>
                            <div style="text-align: right;">
                                <div style="font-size: 1rem; font-weight: 700;">${stat.value}</div>
                                <div style="font-size: 0.7rem; opacity: 0.6;">${stat.avg}/gm</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Error Stats -->
            <div style="
                position: absolute;
                top: 500px;
                left: 20px;
                right: 20px;
                background: rgba(255,255,255,0.1);
                border-radius: 12px;
                padding: 15px;
                z-index: 2;
            ">
                <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 10px; color: #ff6b6b; text-transform: uppercase;">
                    Errors
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    ${errorStats.map(stat => `
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            padding: 6px 0;
                            border-bottom: 1px solid rgba(255,255,255,0.1);
                        ">
                            <span style="font-size: 0.85rem; opacity: 0.9;">${stat.label}</span>
                            <div style="text-align: right;">
                                <div style="font-size: 1rem; font-weight: 700;">${stat.value}</div>
                                <div style="font-size: 0.7rem; opacity: 0.6;">${stat.avg}/gm</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Footer -->
            <div style="
                position: absolute;
                bottom: 15px;
                left: 0;
                right: 0;
                text-align: center;
                font-size: 0.8rem;
                font-weight: 600;
                opacity: 0.6;
                letter-spacing: 1px;
            ">
                Roblox Volleyball League • Player Card Back
            </div>
        </div>
    `;

    //  Mount container off-screen so html2canvas can read it
    document.body.appendChild(container);

    // Force body background to transparent
    const originalBodyBg = document.body.style.background;
    document.body.style.background = 'transparent';

    try
    {
        //  Snapshot → canvas → base-64 PNG
        const canvas = await html2canvas
        (
            container,
            {
                width: 1100,
                height: 700,
                background: 'transparent',
                useCORS: true,
                allowTaint: true,
                logging: false
            }
        );

        return canvas.toDataURL('image/png', 1.0);
    }
    finally
    {
        //  Clean up DOM node and restore body background
        document.body.removeChild(container);
        document.body.style.background = originalBodyBg;
    }
};

/*───────────────────────────────────────────────────────────────*
 *  Back Card Generator – Detailed Stats & Info                  *
 *───────────────────────────────────────────────────────────────*/
export const generatePlayerCardBack = async (data: PlayerCardData): Promise<string> =>
{
    //  Resolve team name for chosen season
    const teamName = data.player?.teams?.length
        ? (
            data.seasonNumber === 0
                ? data.player.teams.at(-1).name
                : (
                    data.player.teams.find(
                        (t: any) => t.season?.seasonNumber === data.seasonNumber
                    )?.name ?? ''
                )
        )
        : '';

    //  Create detailed stats sections
    const offensiveStats = [
        { label: 'Spike Kills', value: data.seasonStats.spikeKills, avg: data.seasonAverages.spikeKills },
        { label: 'Spike Attempts', value: data.seasonStats.spikeAttempts, avg: data.seasonAverages.spikeAttempts },
        { label: 'Ape Kills', value: data.seasonStats.apeKills, avg: data.seasonAverages.apeKills },
        { label: 'Ape Attempts', value: data.seasonStats.apeAttempts, avg: data.seasonAverages.apeAttempts },
        { label: 'Aces', value: data.seasonStats.aces, avg: data.seasonAverages.aces },
        { label: 'Assists', value: data.seasonStats.assists, avg: data.seasonAverages.assists },
    ];

    const defensiveStats = [
        { label: 'Digs', value: data.seasonStats.digs, avg: data.seasonAverages.digs },
        { label: 'Blocks', value: data.seasonStats.blocks, avg: data.seasonAverages.blocks },
        { label: 'Block Follows', value: data.seasonStats.blockFollows, avg: data.seasonAverages.blockFollows },
    ];

    const errorStats = [
        { label: 'Spiking Errors', value: data.seasonStats.spikingErrors, avg: data.seasonAverages.spikingErrors },
        { label: 'Setting Errors', value: data.seasonStats.settingErrors, avg: data.seasonAverages.settingErrors },
        { label: 'Serving Errors', value: data.seasonStats.servingErrors, avg: data.seasonAverages.servingErrors },
        { label: 'Misc Errors', value: data.seasonStats.miscErrors, avg: data.seasonAverages.miscErrorsPerGame },
    ];

    //  Create off-screen card container
    const card = document.createElement('div');
    card.style.position     = 'absolute';
    card.style.left         = '-9999px';
    card.style.top          = '0';
    card.style.width        = '500px';
    card.style.height       = '700px';
    card.style.background   = 'linear-gradient(135deg,#141e30 0%,#243b55 50%,#141e30 100%)';
    card.style.color        = '#ffffff';
    card.style.fontFamily   = '"Oswald","Segoe UI",Tahoma,Geneva,Verdana,sans-serif';
    card.style.borderRadius = '24px';
    card.style.boxShadow    = '0 14px 28px rgba(0,0,0,0.45)';
    card.style.overflow     = 'hidden';

    //  Build interior markup
    card.innerHTML = `
        <!-- Header -->
        <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 80px;
            background: linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
            border-bottom: 2px solid rgba(255,255,255,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
        ">
            <div style="text-align: center;">
                <div style="font-size: 1.8rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">
                    ${data.player.name}
                </div>
                <div style="font-size: 1rem; font-weight: 600; opacity: 0.8; margin-top: 4px;">
                    ${teamName} • Season ${data.seasonNumber === 0 ? 'Career' : data.seasonNumber}
                </div>
            </div>
        </div>

        <!-- Season Summary -->
        <div style="
            position: absolute;
            top: 100px;
            left: 20px;
            right: 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 15px;
            z-index: 2;
        ">
            <div style="font-size: 1.2rem; font-weight: 700; margin-bottom: 10px; text-transform: uppercase;">
                Season Summary
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                <div style="text-align: center;">
                    <div style="font-size: 2rem; font-weight: 900; color: #4a90e2;">${data.seasonStats.gamesPlayed}</div>
                    <div style="font-size: 0.8rem; opacity: 0.8;">Games Played</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 2rem; font-weight: 900; color: #50c878;">${data.seasonStats.spikeKills + data.seasonStats.apeKills}</div>
                    <div style="font-size: 0.8rem; opacity: 0.8;">Total Kills</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 2rem; font-weight: 900; color: #ff6b6b;">${data.seasonStats.spikingErrors + data.seasonStats.settingErrors + data.seasonStats.servingErrors}</div>
                    <div style="font-size: 0.8rem; opacity: 0.8;">Total Errors</div>
                </div>
            </div>
        </div>

        <!-- Offensive Stats -->
        <div style="
            position: absolute;
            top: 220px;
            left: 20px;
            right: 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 15px;
            z-index: 2;
        ">
            <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 10px; color: #4a90e2; text-transform: uppercase;">
                Offensive Stats
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                ${offensiveStats.map(stat => `
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 6px 0;
                        border-bottom: 1px solid rgba(255,255,255,0.1);
                    ">
                        <span style="font-size: 0.85rem; opacity: 0.9;">${stat.label}</span>
                        <div style="text-align: right;">
                            <div style="font-size: 1rem; font-weight: 700;">${stat.value}</div>
                            <div style="font-size: 0.7rem; opacity: 0.6;">${stat.avg}/gm</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Defensive Stats -->
        <div style="
            position: absolute;
            top: 380px;
            left: 20px;
            right: 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 15px;
            z-index: 2;
        ">
            <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 10px; color: #50c878; text-transform: uppercase;">
                Defensive Stats
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                ${defensiveStats.map(stat => `
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 6px 0;
                        border-bottom: 1px solid rgba(255,255,255,0.1);
                    ">
                        <span style="font-size: 0.85rem; opacity: 0.9;">${stat.label}</span>
                        <div style="text-align: right;">
                            <div style="font-size: 1rem; font-weight: 700;">${stat.value}</div>
                            <div style="font-size: 0.7rem; opacity: 0.6;">${stat.avg}/gm</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Error Stats -->
        <div style="
            position: absolute;
            top: 500px;
            left: 20px;
            right: 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 15px;
            z-index: 2;
        ">
            <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 10px; color: #ff6b6b; text-transform: uppercase;">
                Errors
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                ${errorStats.map(stat => `
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 6px 0;
                        border-bottom: 1px solid rgba(255,255,255,0.1);
                    ">
                        <span style="font-size: 0.85rem; opacity: 0.9;">${stat.label}</span>
                        <div style="text-align: right;">
                            <div style="font-size: 1rem; font-weight: 700;">${stat.value}</div>
                            <div style="font-size: 0.7rem; opacity: 0.6;">${stat.avg}/gm</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Footer -->
        <div style="
            position: absolute;
            bottom: 15px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 0.8rem;
            font-weight: 600;
            opacity: 0.6;
            letter-spacing: 1px;
        ">
            Roblox Volleyball League • Player Card Back
        </div>
    `;

    //  Mount card off-screen so html2canvas can read it
    document.body.appendChild(card);

    try
    {
        //  Snapshot → canvas → base-64 PNG
        const canvas = await html2canvas
        (
            card,
            {
                width: 500,
                height: 700,
                background: 'transparent',
                useCORS: true,
                allowTaint: true,
                logging: false
            }
        );

        return canvas.toDataURL('image/png', 1.0);
    }
    finally
    {
        //  Clean up DOM node
        document.body.removeChild(card);
    }
};

/*───────────────────────────────────────────────────────────────*
 *  Generate Both Front & Back Cards Side by Side                *
 *───────────────────────────────────────────────────────────────*/
export const generatePlayerCardSet = async (data: PlayerCardData): Promise<string> =>
{
    //  Generate both cards
    const [frontCard, backCard] = await Promise.all([
        generatePlayerCard(data),
        generatePlayerCardBack(data)
    ]);

    //  Create container for side-by-side layout
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '1020px';
    container.style.height = '700px';
    container.style.display = 'flex';
    container.style.gap = '20px';
    container.style.background = 'transparent';

    //  Add both cards to container
    container.innerHTML = `
        <img src="${frontCard}" alt="Front Card" style="width: 500px; height: 700px; border-radius: 24px; box-shadow: 0 14px 28px rgba(0,0,0,0.45);" />
        <img src="${backCard}" alt="Back Card" style="width: 500px; height: 700px; border-radius: 24px; box-shadow: 0 14px 28px rgba(0,0,0,0.45);" />
    `;

    //  Mount container off-screen
    document.body.appendChild(container);

    try
    {
        //  Snapshot → canvas → base-64 PNG
        const canvas = await html2canvas
        (
            container,
            {
                width: 1020,
                height: 700,
                background: 'transparent',
                useCORS: true,
                allowTaint: true,
                logging: false
            }
        );

        return canvas.toDataURL('image/png', 1.0);
    }
    finally
    {
        //  Clean up DOM node
        document.body.removeChild(container);
    }
};

/*───────────────────────────────────────────────────────────────*
 *  Stat-Label Prettifier                                        *
 *───────────────────────────────────────────────────────────────*/
export const formatStatName = (key: string): string =>
{
    //  Human-friendly mapping
    const map: Record<string, string> =
    {
        spikeKills:        'Spike Kills',
        spikeAttempts:     'Spike Attempts',
        apeKills:          'Ape Kills',
        apeAttempts:       'Ape Attempts',
        spikingErrors:     'Spiking Errors',
        digs:              'Digs',
        blocks:            'Blocks',
        assists:           'Assists',
        aces:              'Aces',
        settingErrors:     'Setting Errors',
        blockFollows:      'Block Follows',
        servingErrors:     'Serving Errors',
        miscErrors:        'Misc Errors',
        gamesPlayed:       'Games Played',
        miscErrorsPerGame: 'Misc Errors / Game'
    };

    //  Return mapped name or derive from camelCase
    return map[key] ??
        key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (s) => s.toUpperCase());
};

/*───────────────────────────────────────────────────────────────*
 *  Client-Side PNG Downloader                                   *
 *───────────────────────────────────────────────────────────────*/
export const downloadPlayerCard = (
    dataUrl: string,
    playerName: string,
    seasonNumber: number
): void =>
{
    //  Create hidden link
    const link = document.createElement('a');
    link.download =
        `${playerName.replace(/\s+/g, '_')}_Season_${
            seasonNumber === 0 ? 'Career' : seasonNumber
        }_Card.png`;
    link.href = dataUrl;

    //  Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
