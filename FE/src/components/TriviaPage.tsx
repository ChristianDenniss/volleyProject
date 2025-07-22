import React, { useState, useRef } from 'react';
import '../styles/TriviaPage.css';
import { 
    TriviaPlayer, 
    TriviaTeam, 
    TriviaSeason, 
    Hint, 
    GuessResult, 
    TriviaData 
} from '../types/interfaces';
import { useTriviaPlayer, useTriviaTeam, useTriviaSeason, useSubmitTriviaGuess } from '../hooks/allFetch';

type GameState = 'selection' | 'playing' | 'result';

type Difficulty = 'easy' | 'medium' | 'hard' | 'impossible';
type TriviaType = 'player' | 'team' | 'season';

const DEBOUNCE_MS = 1200;

const TriviaPage: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>('selection');
    const [selectedType, setSelectedType] = useState<TriviaType | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
    const [currentTrivia, setCurrentTrivia] = useState<TriviaData | null>(null);
    const [currentHints, setCurrentHints] = useState<Hint[]>([]);
    const [userGuess, setUserGuess] = useState('');
    const [guessResult, setGuessResult] = useState<GuessResult | null>(null);
    const [hintLevel, setHintLevel] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [debounce, setDebounce] = useState(false);
    const debounceTimeout = useRef<number | null>(null);

    // Hooks for fetching trivia - initialize with current difficulty
    const triviaPlayer = useTriviaPlayer(selectedDifficulty || 'easy');
    const triviaTeam = useTriviaTeam(selectedDifficulty || 'easy');
    const triviaSeason = useTriviaSeason(selectedDifficulty || 'easy');
    const submitGuessHook = useSubmitTriviaGuess();

    // Helper to debounce button actions
    const triggerDebounce = () => {
        setDebounce(true);
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = window.setTimeout(() => setDebounce(false), DEBOUNCE_MS);
    };

    // Start game using hooks
    const startGame = async () => {
        console.log('🎮 [TriviaPage] Starting game with:', { selectedType, selectedDifficulty, debounce });
        
        if (!selectedType || !selectedDifficulty || debounce) {
            console.log('❌ [TriviaPage] Cannot start game - missing data or debounced');
            return;
        }
        
        console.log('🎮 [TriviaPage] Initializing game state...');
        setError(null);
        setCurrentTrivia(null);
        setCurrentHints([]);
        setUserGuess('');
        setGuessResult(null);
        setHintLevel(1);
        setGameState('playing');
        triggerDebounce();
        
        try {
            console.log('🎮 [TriviaPage] Fetching trivia data for type:', selectedType);
            let triviaData: TriviaData | null = null;
            
            if (selectedType === 'player') {
                console.log('🎮 [TriviaPage] Fetching trivia player...');
                triviaData = await triviaPlayer.fetchTriviaPlayer();
                console.log('🎮 [TriviaPage] Trivia player data:', triviaData);
            } else if (selectedType === 'team') {
                console.log('🎮 [TriviaPage] Fetching trivia team...');
                triviaData = await triviaTeam.fetchTriviaTeam();
                console.log('🎮 [TriviaPage] Trivia team data:', triviaData);
            } else if (selectedType === 'season') {
                console.log('🎮 [TriviaPage] Fetching trivia season...');
                triviaData = await triviaSeason.fetchTriviaSeason();
                console.log('🎮 [TriviaPage] Trivia season data:', triviaData);
            }
            
            if (!triviaData) {
                console.error('❌ [TriviaPage] No trivia data found after fetch');
                setError('No trivia data found.');
                setGameState('selection');
                return;
            }
            
            console.log('✅ [TriviaPage] Successfully got trivia data, setting current trivia');
            setCurrentTrivia(triviaData);
            generateHints(triviaData, selectedType, 1);
        } catch (err: any) {
            console.error('❌ [TriviaPage] Error starting game:', err);
            setError(err.message || 'Failed to start game');
            setGameState('selection');
        }
    };

    // Generate hints
    const generateHints = (triviaData: TriviaData, type: string, maxLevel: number) => {
        const hints: Hint[] = [];
        switch (type) {
            case 'player':
                hints.push(...generatePlayerHints(triviaData as TriviaPlayer, maxLevel));
                break;
            case 'team':
                hints.push(...generateTeamHints(triviaData as TriviaTeam, maxLevel));
                break;
            case 'season':
                hints.push(...generateSeasonHints(triviaData as TriviaSeason, maxLevel));
                break;
        }
        
        // Always start with first letter hint, then randomize the rest
        const firstLetterHint = hints.find(hint => hint.text.includes('First letter:'));
        const otherHints = hints.filter(hint => !hint.text.includes('First letter:'));
        
        // Shuffle the other hints
        const shuffledHints = otherHints.sort(() => Math.random() - 0.5);
        
        // Combine first letter hint with shuffled hints
        const finalHints = firstLetterHint ? [firstLetterHint, ...shuffledHints] : shuffledHints;
        
        setCurrentHints(finalHints);
    };

    // Hint generators (same as before)
    const generatePlayerHints = (player: TriviaPlayer, maxLevel: number): Hint[] => {
        const hints: Hint[] = [];
        
        // Basic hints (levels 1-3)
        hints.push({ text: `First letter: ${player.name.charAt(0)}`, level: 1 });
        if (player.position && player.position !== "N/A") {
            hints.push({ text: `Position: ${player.position}`, level: 2 });
        }
        if (player.teams && player.teams.length > 0) {
            hints.push({ text: `Has played for ${player.teams.length} team(s)`, level: 3 });
        }
        
        // Medium hints (levels 4-6)
        if (player.awards && player.awards.length > 0) {
            // Show specific award with season
            const firstAward = player.awards[0];
            if (firstAward.season) {
                hints.push({ text: `Won the ${firstAward.type} award in Season ${firstAward.season.seasonNumber}`, level: 4 });
            } else {
                hints.push({ text: `Won the ${firstAward.type} award`, level: 4 });
            }
        }

        if (player.records && player.records.length > 0) {
            hints.push({ text: `Has ${player.records.length} record(s)`, level: 6 });
        }
        
        // Detailed hints (levels 7-9)
        if (player.teams && player.teams.length > 0) {
            const teamNames = player.teams.map(t => t.name).join(', ');
            hints.push({ text: `Teams: ${teamNames}`, level: 7 });
        }
        
        // Rings hint (teams with 1st place)
        if (player.teams && player.teams.length > 0) {
            const championshipTeams = player.teams.filter(t => t.placement && t.placement.includes("1st"));
            if (championshipTeams.length > 0) {
                hints.push({ text: `Has ${championshipTeams.length} ring(s)`, level: 8 });
            }
        }
        
        // Grand finals hint (1st + 2nd place teams)
        if (player.teams && player.teams.length > 0) {
            const grandFinalsTeams = player.teams.filter(t => t.placement && (t.placement.includes("1st") || t.placement.includes("2nd")));
            if (grandFinalsTeams.length > 0) {
                hints.push({ text: `Been to grand finals ${grandFinalsTeams.length} time(s)`, level: 9 });
            }
        }
        if (player.records && player.records.length > 0) {
            const recordDetails = player.records.map(r => `${r.type} - ${r.rank}${r.rank === 1 ? 'st' : r.rank === 2 ? 'nd' : r.rank === 3 ? 'rd' : 'th'} place`).join(', ');
            hints.push({ text: `Records: ${recordDetails}`, level: 9 });
        }
        
        // Advanced hints (levels 10-12)
        if (player.teams && player.teams.length > 0) {
            const validPlacements = player.teams
                .map(t => t.placement)
                .filter(p => p && p !== "Didnt make playoffs");
            
            if (validPlacements.length > 0) {
                // Find the best placement (G.O.A.T. > 1st > 2nd > 3rd > top 4 > top 6 > top 8 > top 12 > top 16 > didn't make playoffs)
                const getPlacementRank = (placement: string): number => {
                    if (placement.includes("G.O.A.T.")) return 0; // Highest placement
                    if (placement.includes("1st")) return 1;
                    if (placement.includes("2nd")) return 2;
                    if (placement.includes("3rd")) return 3;
                    if (placement.includes("top 4")) return 4;
                    if (placement.includes("top 6")) return 6;
                    if (placement.includes("top 8")) return 8;
                    if (placement.includes("top 12")) return 12;
                    if (placement.includes("top 16")) return 16;
                    if (placement.includes("Didnt make playoffs")) return 999;
                    return 999; // Unknown placement
                };
                
                const bestPlacement = validPlacements.reduce((best, current) => {
                    const bestRank = getPlacementRank(best);
                    const currentRank = getPlacementRank(current);
                    return currentRank < bestRank ? current : best;
                });
                hints.push({ text: `Best placement: ${bestPlacement}`, level: 10 });
            }
        }
        if (player.stats && player.stats.length > 0) {
            const totalAces = player.stats.reduce((sum, stat) => sum + (stat.aces || 0), 0);
            if (totalAces > 0) {
                hints.push({ text: `Total aces: ${totalAces}`, level: 11 });
            }
        }
        if (player.name.length > 0) {
            hints.push({ text: `Name length: ${player.name.length} characters`, level: 12 });
        }
        
        return hints.slice(0, maxLevel);
    };
    const generateTeamHints = (team: TriviaTeam, maxLevel: number): Hint[] => {
        const hints: Hint[] = [];
        
        // Basic hints (levels 1-3)
        hints.push({ text: `First letter: ${team.name.charAt(0)}`, level: 1 });
        if (team.placement) {
            if (team.placement === "Didnt make playoffs") {
                hints.push({ text: `Did not make playoffs`, level: 2 });
            } else if (team.placement.includes("1st")) {
                hints.push({ text: `Championship team (1st place)`, level: 2 });
            } else if (team.placement.includes("2nd")) {
                hints.push({ text: `Runner-up team (2nd place)`, level: 2 });
            } else if (team.placement.includes("3rd")) {
                hints.push({ text: `3rd place team`, level: 2 });
            } else {
                hints.push({ text: `Placement: ${team.placement}`, level: 2 });
            }
        }
        if (team.season) {
            hints.push({ text: `Played in Season ${team.season.seasonNumber}`, level: 3 });
        }
        
        // Medium hints (levels 4-6)
        if (team.players && team.players.length > 0) {
            hints.push({ text: `Has ${team.players.length} player(s)`, level: 4 });
        }
        if (team.games && team.games.length > 0) {
            hints.push({ text: `Played ${team.games.length} game(s)`, level: 5 });
        }
        if (team.season && team.season.theme && team.season.theme !== "None") {
            hints.push({ text: `Season theme: ${team.season.theme}`, level: 6 });
        }
        
        // Detailed hints (levels 7-9)
        if (team.players && team.players.length > 0) {
            const playerNames = team.players.map(p => p.name).join(', ');
            hints.push({ text: `Players: ${playerNames}`, level: 7 });
        }
        if (team.placement) {
            hints.push({ text: `Full placement: ${team.placement}`, level: 8 });
        }
        if (team.season) {
            const year = new Date(team.season.startDate).getFullYear();
            hints.push({ text: `Season started in ${year}`, level: 9 });
        }
        
        // Advanced hints (levels 10-12)
        if (team.players && team.players.length > 0) {
            const positions = [...new Set(team.players.map(p => p.position).filter(p => p && p !== "N/A"))];
            if (positions.length > 0) {
                hints.push({ text: `Player positions: ${positions.join(', ')}`, level: 10 });
            }
        }
        if (team.name.length > 0) {
            hints.push({ text: `Team name length: ${team.name.length} characters`, level: 11 });
        }
        if (team.games && team.games.length > 0) {
            const totalScore = team.games.reduce((sum, game) => {
                // Determine if this team is team1 or team2 and get their score
                const teamScore = game.team1Score || game.team2Score || 0;
                return sum + teamScore;
            }, 0);
            hints.push({ text: `Total points scored: ${totalScore}`, level: 12 });
        }
        
        return hints.slice(0, maxLevel);
    };
    const generateSeasonHints = (season: TriviaSeason, maxLevel: number): Hint[] => {
        const hints: Hint[] = [];
        const seasonNum = season.seasonNumber;
        
        // Basic hints (levels 1-3)
        if (seasonNum <= 5) {
            hints.push({ text: 'Season number is 5 or lower', level: 1 });
        } else if (seasonNum <= 10) {
            hints.push({ text: 'Season number is between 6 and 10', level: 1 });
        } else {
            hints.push({ text: 'Season number is higher than 10', level: 1 });
        }
        if (season.theme && season.theme !== "None") {
            hints.push({ text: `Theme: ${season.theme}`, level: 2 });
        }
        if (season.teams && season.teams.length > 0) {
            hints.push({ text: `Has ${season.teams.length} team(s)`, level: 3 });
        }
        
        // Medium hints (levels 4-6)
        const year = new Date(season.startDate).getFullYear();
        hints.push({ text: `Started in ${year}`, level: 4 });
        if (season.games && season.games.length > 0) {
            hints.push({ text: `Had ${season.games.length} game(s)`, level: 5 });
        }
        if (season.awards && season.awards.length > 0) {
            hints.push({ text: `Had ${season.awards.length} award(s)`, level: 6 });
        }
        
        // Detailed hints (levels 7-9)
        if (season.teams && season.teams.length > 0) {
            const teamNames = season.teams.map(t => t.name).join(', ');
            hints.push({ text: `Teams: ${teamNames}`, level: 7 });
        }
        if (season.records && season.records.length > 0) {
            hints.push({ text: `Had ${season.records.length} record(s)`, level: 8 });
        }
        const endYear = new Date(season.endDate).getFullYear();
        if (endYear !== year) {
            hints.push({ text: `Ended in ${endYear}`, level: 9 });
        }
        
        // Advanced hints (levels 10-12)
        if (season.teams && season.teams.length > 0) {
            const placements = season.teams.map(t => t.placement).filter(p => p && p !== "Didnt make playoffs");
            if (placements.length > 0) {
                const topPlacements = placements.filter(p => p.includes("1st") || p.includes("2nd") || p.includes("3rd"));
                if (topPlacements.length > 0) {
                    hints.push({ text: `Top placements: ${topPlacements.join(', ')}`, level: 10 });
                }
            }
        }
        if (season.awards && season.awards.length > 0) {
            const awardTypes = [...new Set(season.awards.map(a => a.type))];
            hints.push({ text: `Award types: ${awardTypes.join(', ')}`, level: 11 });
        }
        if (season.records && season.records.length > 0) {
            const recordTypes = [...new Set(season.records.map(r => r.type))];
            hints.push({ text: `Record types: ${recordTypes.join(', ')}`, level: 12 });
        }
        
        return hints.slice(0, maxLevel);
    };

    // Submit guess using hook
    const submitGuess = async () => {
        console.log('🎯 [TriviaPage] Submitting guess:', { 
            currentTrivia: currentTrivia?.id, 
            userGuess: userGuess.trim(), 
            debounce 
        });
        
        if (!currentTrivia || !userGuess.trim() || debounce) {
            console.log('❌ [TriviaPage] Cannot submit guess - missing data or debounced');
            return;
        }
        
        triggerDebounce();
        try {
            const type = selectedType!;
            const id = currentTrivia.id;
            const guess = userGuess.trim();
            
            console.log('🎯 [TriviaPage] Submitting guess with:', { type, id, guess });
            const result = await submitGuessHook.submitGuess(type, id, guess);
            console.log('🎯 [TriviaPage] Guess result:', result);
            
            setGuessResult(result);
            if (result?.correct) {
                console.log('✅ [TriviaPage] Correct guess! Moving to result screen');
                setGameState('result');
            } else {
                console.log('❌ [TriviaPage] Incorrect guess, checking hint levels');
                const nextLevel = hintLevel + 1;
                if (nextLevel <= (currentTrivia as any).hintCount) {
                    console.log('🎯 [TriviaPage] More hints available, increasing level to:', nextLevel);
                    setHintLevel(nextLevel);
                    generateHints(currentTrivia, type, nextLevel);
                } else {
                    console.log('🎯 [TriviaPage] No more hints, moving to result screen');
                    setGameState('result');
                }
            }
        } catch (err: any) {
            console.error('❌ [TriviaPage] Error submitting guess:', err);
            setError(err.message || 'Failed to submit guess');
        }
    };

    const resetGame = () => {
        setGameState('selection');
        setSelectedType(null);
        setSelectedDifficulty(null);
        setCurrentTrivia(null);
        setCurrentHints([]);
        setUserGuess('');
        setGuessResult(null);
        setHintLevel(1);
        setError(null);
    };

    const giveUp = () => {
        if (currentTrivia) {
            const answer = selectedType === 'season' 
                ? `Season ${(currentTrivia as TriviaSeason).seasonNumber}`
                : (currentTrivia as TriviaPlayer | TriviaTeam).name;
            setGuessResult({
                correct: false,
                answer,
                message: 'Better luck next time!'
            });
            setGameState('result');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            submitGuess();
        }
    };

    const renderSelectionScreen = () => (
        <div className="trivia-selection">
            <h1>Volleyball 4.2 Trivia</h1>
            <p>Test your knowledge of RVL players, teams, and seasons!</p>
            <div className="selection-section">
                <h2>What would you like to guess?</h2>
                <div className="type-buttons">
                    <button
                        className={`type-btn ${selectedType === 'player' ? 'selected' : ''}`}
                        onClick={() => setSelectedType('player')}
                        disabled={debounce}
                    >
                        <span className="type-icon">P</span>
                        <span className="type-label">Player</span>
                    </button>
                    <button
                        className={`type-btn ${selectedType === 'team' ? 'selected' : ''}`}
                        onClick={() => setSelectedType('team')}
                        disabled={debounce}
                    >
                        <span className="type-icon">T</span>
                        <span className="type-label">Team</span>
                    </button>
                    <button
                        className={`type-btn locked ${selectedType === 'season' ? 'selected' : ''}`}
                        onClick={() => setSelectedType('season')}
                        disabled={true}
                        title="Coming soon - Season trivia is currently being fixed"
                    >
                        <span className="type-icon">🔒</span>
                        <span className="type-label">Season</span>
                        <span className="lock-overlay">🔒</span>
                    </button>
                </div>
            </div>
            {selectedType && (
                <div className="selection-section">
                    <h2>Choose difficulty:</h2>
                    <div className="difficulty-buttons">
                        <button
                            className={`difficulty-btn easy ${selectedDifficulty === 'easy' ? 'selected' : ''}`}
                            onClick={() => setSelectedDifficulty('easy')}
                            disabled={debounce}
                        >
                            Easy
                        </button>
                        <button
                            className={`difficulty-btn medium ${selectedDifficulty === 'medium' ? 'selected' : ''}`}
                            onClick={() => setSelectedDifficulty('medium')}
                            disabled={debounce}
                        >
                            Medium
                        </button>
                        <button
                            className={`difficulty-btn hard ${selectedDifficulty === 'hard' ? 'selected' : ''}`}
                            onClick={() => setSelectedDifficulty('hard')}
                            disabled={debounce}
                        >
                            Hard
                        </button>
                        <button
                            className={`difficulty-btn impossible ${selectedDifficulty === 'impossible' ? 'selected' : ''}`}
                            onClick={() => setSelectedDifficulty('impossible')}
                            disabled={debounce}
                        >
                            Impossible
                        </button>
                    </div>
                </div>
            )}
            {selectedType && selectedDifficulty && (
                <button 
                    className="start-game-btn"
                    onClick={startGame}
                    disabled={debounce}
                >
                    {debounce ? 'Please wait...' : 'Start Game!'}
                </button>
            )}
        </div>
    );

    const renderGameScreen = () => (
        <div className="trivia-game">
            <div className="game-header">
                <h2>Guess the {selectedType}</h2>
                <div className="game-info">
                    <span className={`difficulty-badge ${selectedDifficulty}`}>{selectedDifficulty}</span>
                    <span className="hint-counter">Hint {hintLevel}/{currentTrivia?.hintCount}</span>
                </div>
            </div>
            <div className="hints-section">
                <h3>Hints:</h3>
                <div className="hints-list">
                    {currentHints.map((hint, index) => (
                        <div key={index} className={`hint hint-level-${hint.level}`}>
                            {hint.text}
                        </div>
                    ))}
                </div>
            </div>
            <div className="guess-section">
                <input
                    type="text"
                    value={userGuess}
                    onChange={(e) => setUserGuess(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Enter your guess...`}
                    className="guess-input"
                    disabled={debounce}
                />
                <div className="guess-buttons">
                    <button 
                        className="submit-btn"
                        onClick={submitGuess}
                        disabled={!userGuess.trim() || debounce}
                    >
                        {debounce ? 'Please wait...' : 'Submit Guess'}
                    </button>
                    <button 
                        className="give-up-btn"
                        onClick={giveUp}
                    >
                        Give Up
                    </button>
                </div>
            </div>
            {guessResult && !guessResult.correct && (
                <div className="incorrect-message">
                    {guessResult.message}
                </div>
            )}
        </div>
    );

    const renderResultScreen = () => (
        <div className="trivia-result">
            <h2>Game Over!</h2>
            <div className="result-content">
                {guessResult?.correct ? (
                    <div className="correct-result">
                        <span className="result-icon">✓</span>
                        <h3>Congratulations!</h3>
                        <p>You guessed correctly!</p>
                    </div>
                ) : (
                    <div className="incorrect-result">
                        <span className="result-icon">!</span>
                        <h3>The answer was:</h3>
                        <p className="correct-answer">{guessResult?.answer}</p>
                    </div>
                )}
                <div className="game-stats">
                    <p>Difficulty: <span className="stat-value">{selectedDifficulty}</span></p>
                    <p>Type: <span className="stat-value">{selectedType}</span></p>
                    <p>Hints used: <span className="stat-value">{hintLevel} / {currentTrivia?.hintCount || 0}</span></p>
                    <p>Total hints available: <span className="stat-value">{currentTrivia?.hintCount || 0}</span></p>
                    {currentTrivia && (
                        <>
                            {selectedType === 'player' && (
                                <>
                                    <p>Player name: <span className="stat-value">{(currentTrivia as TriviaPlayer).name}</span></p>
                                    {(currentTrivia as TriviaPlayer).position && (
                                        <p>Position: <span className="stat-value">{(currentTrivia as TriviaPlayer).position}</span></p>
                                    )}
                                </>
                            )}
                            {selectedType === 'team' && (
                                <>
                                    <p>Team name: <span className="stat-value">{(currentTrivia as TriviaTeam).name}</span></p>
                                    <p>Placement: <span className="stat-value">{(currentTrivia as TriviaTeam).placement}</span></p>
                                </>
                            )}
                            {selectedType === 'season' && (
                                <p>Season number: <span className="stat-value">{(currentTrivia as TriviaSeason).seasonNumber}</span></p>
                            )}
                        </>
                    )}
                </div>
            </div>
            <div className="result-buttons">
                <button className="play-again-btn" onClick={resetGame}>
                    Play Again
                </button>
            </div>
        </div>
    );

    // Check for loading states
    const isLoading = triviaPlayer.loading || triviaTeam.loading || triviaSeason.loading;
    
    // Check for errors
    const hasError = triviaPlayer.error || triviaTeam.error || triviaSeason.error || error;
    
    // Function to dismiss all errors
    const dismissError = () => {
        setError(null);
        // Clear hook errors by calling their fetch functions
        if (selectedDifficulty) {
            triviaPlayer.fetchTriviaPlayer();
            triviaTeam.fetchTriviaTeam();
            triviaSeason.fetchTriviaSeason();
        }
    };
    
    return (
        <div className={`trivia-page ${isLoading ? 'loading' : ''}`}>
            {hasError && (
                <div className="error-message">
                    <h3>Error</h3>
                    <p>{hasError}</p>
                    <button onClick={dismissError}>Dismiss</button>
                </div>
            )}
            
            {isLoading && gameState === 'playing' && (
                <div className="loading-message">
                    <h3>Loading trivia...</h3>
                    <p>Please wait while we fetch your trivia question.</p>
                </div>
            )}
            
            {gameState === 'selection' && renderSelectionScreen()}
            {gameState === 'playing' && !isLoading && renderGameScreen()}
            {gameState === 'result' && renderResultScreen()}
        </div>
    );
};

export default TriviaPage; 