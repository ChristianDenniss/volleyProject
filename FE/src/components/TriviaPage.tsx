import React, { useState, useRef, useEffect } from 'react';
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

// Score system constants
const BASE_SCORES = {
    easy: 100,
    medium: 200,
    hard: 300,
    impossible: 500
};

const HINT_PENALTY = 20; // Points deducted per hint used
const TIME_BONUS_PER_SECOND = 5; // Points added per second remaining
const GAME_TIME_LIMIT = 60; // 60 seconds (1 minute)

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
    const [finalScore, setFinalScore] = useState<number>(0);
    const [timeRemaining, setTimeRemaining] = useState<number>(GAME_TIME_LIMIT);
    const [timeBonus, setTimeBonus] = useState<number>(0);
    const [gameStartTime, setGameStartTime] = useState<number | null>(null);
    const [timeSolved, setTimeSolved] = useState<number>(0);
    const debounceTimeout = useRef<number | null>(null);
    const timerInterval = useRef<number | null>(null);

    // Hooks for fetching trivia - initialize with current difficulty
    const triviaPlayer = useTriviaPlayer(selectedDifficulty || 'easy');
    const triviaTeam = useTriviaTeam(selectedDifficulty || 'easy');
    const triviaSeason = useTriviaSeason(selectedDifficulty || 'easy');
    const submitGuessHook = useSubmitTriviaGuess();

    // Watch for time running out
    useEffect(() => {
        if (timeRemaining <= 0 && gameState === 'playing') {
            console.log('⏰ [TriviaPage] Time ran out! Calling giveUp()...');
            giveUp();
        }
    }, [timeRemaining, gameState]);

    // Helper to debounce button actions
    const triggerDebounce = () => {
        setDebounce(true);
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = window.setTimeout(() => setDebounce(false), DEBOUNCE_MS);
    };

    // Start the game timer
    const startTimer = () => {
        setTimeRemaining(GAME_TIME_LIMIT);
        setGameStartTime(Date.now());
        
        timerInterval.current = window.setInterval(() => {
            setTimeRemaining(prev => {
                console.log('⏰ [TriviaPage] Timer tick, prev:', prev);
                if (prev <= 1) {
                    // Time's up!
                    if (timerInterval.current) {
                        clearInterval(timerInterval.current);
                        timerInterval.current = null;
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Stop the timer
    const stopTimer = () => {
        if (timerInterval.current) {
            clearInterval(timerInterval.current);
            timerInterval.current = null;
        }
    };

    // Calculate time bonus
    const calculateTimeBonus = (): number => {
        if (!gameStartTime) return 0;
        const timeUsed = Math.floor((Date.now() - gameStartTime) / 1000);
        const timeRemaining = Math.max(GAME_TIME_LIMIT - timeUsed, 0);
        return timeRemaining * TIME_BONUS_PER_SECOND;
    };

    // Calculate time solved
    const calculateTimeSolved = (): number => {
        if (!gameStartTime) return 0;
        const timeUsed = Math.floor((Date.now() - gameStartTime) / 1000);
        return Math.min(timeUsed, GAME_TIME_LIMIT); // Cap at game time limit
    };

    // Calculate final score based on difficulty and hints used
    const calculateScore = (difficulty: Difficulty, hintsUsed: number): number => {
        const baseScore = BASE_SCORES[difficulty];
        // First letter hint is free, so subtract 1 from hints used for penalty calculation
        const penaltyHints = Math.max(hintsUsed - 1, 0);
        const penalty = penaltyHints * HINT_PENALTY;
        const timeBonus = calculateTimeBonus();
        const finalScore = Math.max(baseScore - penalty + timeBonus, 0); // Ensure score doesn't go below 0
        return finalScore;
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
        setFinalScore(0);
        setTimeBonus(0);
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
            
            // Start the timer after trivia data is loaded
            startTimer();
        } catch (err: any) {
            console.error('❌ [TriviaPage] Error starting game:', err);
            setError(err.message || 'Failed to start game');
            setGameState('selection');
        }
    };

    const generateHints = (triviaData: TriviaData, type: string, maxLevel: number) => {
        console.log('🎯 [TriviaPage] Generating hints for:', { type, maxLevel });
        let hints: Hint[] = [];
        
        if (type === 'player') {
            hints = generatePlayerHints(triviaData as TriviaPlayer, maxLevel);
        } else if (type === 'team') {
            hints = generateTeamHints(triviaData as TriviaTeam, maxLevel);
        } else if (type === 'season') {
            hints = generateSeasonHints(triviaData as TriviaSeason, maxLevel);
        }
        
        // Randomize hints after level 1 (keep first letter hint first)
        if (hints.length > 1) {
            const firstHint = hints[0]; // First letter hint (level 1)
            const otherHints = hints.slice(1); // All other hints
            
            // Shuffle the other hints but keep their original level numbers
            const shuffledHints = otherHints.sort(() => Math.random() - 0.5);
            
            // Combine first hint with shuffled hints (levels stay the same)
            hints = [firstHint, ...shuffledHints];
        }
        
        console.log('✅ [TriviaPage] Generated hints:', hints);
        setCurrentHints(hints);
    };

    const generatePlayerHints = (player: TriviaPlayer, maxLevel: number): Hint[] => {
        const hints: Hint[] = [];
        
        // Level 1: First letter (always free)
        if (maxLevel >= 1) {
            hints.push({
                level: 1,
                text: `First letter: ${player.name.charAt(0).toUpperCase()}`
            });
        }
        
        // Level 2: Team count
        if (maxLevel >= 2) {
            const teamCount = player.teams?.length || 0;
            hints.push({
                level: 2,
                text: `Has played for ${teamCount} team${teamCount !== 1 ? 's' : ''}`
            });
        }
        
        // Level 3: Award count
        if (maxLevel >= 3) {
            const awardCount = player.awards?.length || 0;
            hints.push({
                level: 3,
                text: `Has won ${awardCount} award${awardCount !== 1 ? 's' : ''}`
            });
        }
        
        // Level 4: Record count
        if (maxLevel >= 4) {
            const recordCount = player.records?.length || 0;
            hints.push({
                level: 4,
                text: `Has ${recordCount} record${recordCount !== 1 ? 's' : ''}`
            });
        }
        
        // Level 5: Name length
        if (maxLevel >= 5) {
            hints.push({
                level: 5,
                text: `Name has ${player.name.length} letters`
            });
        }
        
        // Level 6: First team name (if available)
        if (maxLevel >= 6 && player.teams && player.teams.length > 0) {
            const firstTeam = player.teams[0];
            hints.push({
                level: 6,
                text: `First team: ${firstTeam.name}`
            });
        }
        
        // Level 7: Most recent team name (if available)
        if (maxLevel >= 7 && player.teams && player.teams.length > 0) {
            const lastTeam = player.teams[player.teams.length - 1];
            hints.push({
                level: 7,
                text: `Most recent team: ${lastTeam.name}`
            });
        }
        
        // Level 8: All awards (if available)
        if (maxLevel >= 8 && player.awards && player.awards.length > 0) {
            const awardTypes = player.awards.map(award => award.type);
            const uniqueAwards = [...new Set(awardTypes)];
            hints.push({
                level: 8,
                text: `Awards won: ${uniqueAwards.join(', ')}`
            });
        }
        
        // Level 9: Last letter
        if (maxLevel >= 9) {
            hints.push({
                level: 9,
                text: `Last letter: ${player.name.charAt(player.name.length - 1).toUpperCase()}`
            });
        }
        
        // Level 10: All team names (if available)
        if (maxLevel >= 10 && player.teams && player.teams.length > 0) {
            const teamNames = player.teams.map(team => team.name);
            hints.push({
                level: 10,
                text: `All teams: ${teamNames.join(', ')}`
            });
        }
        
        // Level 11: Championship rings (if available)
        if (maxLevel >= 11 && player.teams && player.teams.length > 0) {
            const championshipTeams = player.teams.filter(team => 
                team.placement && team.placement.toLowerCase().includes('1st')
            );
            const ringCount = championshipTeams.length;
            if (ringCount > 0) {
                hints.push({
                    level: 11,
                    text: `Championships / rings: ${ringCount}`
                });
            } else {
                hints.push({
                    level: 11,
                    text: `No championship rings`
                });
            }
        }
        
        // Level 12: Missed playoffs count
        if (maxLevel >= 12 && player.teams && player.teams.length > 0) {
            const missedPlayoffsTeams = player.teams.filter(team => 
                team.placement && team.placement.toLowerCase().includes("didn't make playoffs")
            );
            const missedPlayoffsCount = missedPlayoffsTeams.length;
            hints.push({
                level: 12,
                text: `Missed playoffs: ${missedPlayoffsCount} time${missedPlayoffsCount !== 1 ? 's' : ''}`
            });
        }
        
        return hints;
    };

    const generateTeamHints = (team: TriviaTeam, maxLevel: number): Hint[] => {
        const hints: Hint[] = [];
        
        // Level 1: First letter (always free)
        if (maxLevel >= 1) {
            hints.push({
                level: 1,
                text: `First letter: ${team.name.charAt(0).toUpperCase()}`
            });
        }
        
        // Level 2: Placement
        if (maxLevel >= 2 && team.placement) {
            hints.push({
                level: 2,
                text: `Placement: ${team.placement}`
            });
        }
        
        // Level 3: Player count
        if (maxLevel >= 3) {
            const playerCount = team.players?.length || 0;
            hints.push({
                level: 3,
                text: `Has ${playerCount} player${playerCount !== 1 ? 's' : ''}`
            });
        }
        
        // Level 4: Game count
        if (maxLevel >= 4) {
            const gameCount = team.games?.length || 0;
            hints.push({
                level: 4,
                text: `Has played ${gameCount} game${gameCount !== 1 ? 's' : ''}`
            });
        }
        
        // Level 5: Season info
        if (maxLevel >= 5 && team.season) {
            hints.push({
                level: 5,
                text: `Season ${team.season.seasonNumber}`
            });
        }
        
        // Level 6: Season theme
        if (maxLevel >= 6 && team.season && team.season.theme) {
            hints.push({
                level: 6,
                text: `Theme: ${team.season.theme}`
            });
        }
        
        // Level 7: Name length
        if (maxLevel >= 7) {
            hints.push({
                level: 7,
                text: `Name has ${team.name.length} letters`
            });
        }
        
        // Level 8: First player name (if available)
        if (maxLevel >= 8 && team.players && team.players.length > 0) {
            const firstPlayer = team.players[0];
            hints.push({
                level: 8,
                text: `First player: ${firstPlayer.name}`
            });
        }
        
        // Level 9: Last player name (if available)
        if (maxLevel >= 9 && team.players && team.players.length > 0) {
            const lastPlayer = team.players[team.players.length - 1];
            hints.push({
                level: 9,
                text: `Last player: ${lastPlayer.name}`
            });
        }
        
        // Level 10: Season start date
        if (maxLevel >= 10 && team.season && team.season.startDate) {
            hints.push({
                level: 10,
                text: `Season started: ${new Date(team.season.startDate).toLocaleDateString()}`
            });
        }
        
        return hints;
    };

    const generateSeasonHints = (season: TriviaSeason, maxLevel: number): Hint[] => {
        const hints: Hint[] = [];
        
        // Level 1: First letter (always free)
        if (maxLevel >= 1) {
            hints.push({
                level: 1,
                text: `First letter: S`
            });
        }
        
        // Level 2: Season number
        if (maxLevel >= 2) {
            hints.push({
                level: 2,
                text: `Season number: ${season.seasonNumber}`
            });
        }
        
        // Level 3: Theme
        if (maxLevel >= 3 && season.theme) {
            hints.push({
                level: 3,
                text: `Theme: ${season.theme}`
            });
        }
        
        // Level 4: Team count
        if (maxLevel >= 4) {
            const teamCount = season.teams?.length || 0;
            hints.push({
                level: 4,
                text: `Has ${teamCount} team${teamCount !== 1 ? 's' : ''}`
            });
        }
        
        // Level 5: Game count
        if (maxLevel >= 5) {
            const gameCount = season.games?.length || 0;
            hints.push({
                level: 5,
                text: `Has ${gameCount} game${gameCount !== 1 ? 's' : ''}`
            });
        }
        
        // Level 6: Award count
        if (maxLevel >= 6) {
            const awardCount = season.awards?.length || 0;
            hints.push({
                level: 6,
                text: `Has ${awardCount} award${awardCount !== 1 ? 's' : ''}`
            });
        }
        
        // Level 7: Record count
        if (maxLevel >= 7) {
            const recordCount = season.records?.length || 0;
            hints.push({
                level: 7,
                text: `Has ${recordCount} record${recordCount !== 1 ? 's' : ''}`
            });
        }
        
        // Level 8: Start date
        if (maxLevel >= 8 && season.startDate) {
            hints.push({
                level: 8,
                text: `Started: ${new Date(season.startDate).toLocaleDateString()}`
            });
        }
        
        // Level 9: End date
        if (maxLevel >= 9 && season.endDate) {
            hints.push({
                level: 9,
                text: `Ended: ${new Date(season.endDate).toLocaleDateString()}`
            });
        }
        
        // Level 10: First team name (if available)
        if (maxLevel >= 10 && season.teams && season.teams.length > 0) {
            const firstTeam = season.teams[0];
            hints.push({
                level: 10,
                text: `First team: ${firstTeam.name}`
            });
        }
        
        return hints;
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
                console.log('✅ [TriviaPage] Correct guess! Calculating score and moving to result screen');
                stopTimer();
                const timeBonus = calculateTimeBonus();
                const timeSolved = calculateTimeSolved();
                setTimeBonus(timeBonus);
                setTimeSolved(timeSolved);
                const score = calculateScore(selectedDifficulty!, hintLevel);
                setFinalScore(score);
                console.log('🎯 [TriviaPage] Final score calculated:', score, 'Time bonus:', timeBonus, 'Time solved:', timeSolved);
                setGameState('result');
            } else {
                console.log('❌ [TriviaPage] Incorrect guess, checking hint levels');
                const nextLevel = hintLevel + 1;
                if (nextLevel <= (currentTrivia as any).hintCount) {
                    console.log('🎯 [TriviaPage] More hints available, increasing level to:', nextLevel);
                    setHintLevel(nextLevel);
                    generateHints(currentTrivia, type, nextLevel);
                } else {
                    console.log('🎯 [TriviaPage] No more hints, calculating score and moving to result screen');
                    stopTimer();
                    const timeBonus = calculateTimeBonus();
                    const timeSolved = calculateTimeSolved();
                    setTimeBonus(timeBonus);
                    setTimeSolved(timeSolved);
                    const score = calculateScore(selectedDifficulty!, hintLevel);
                    setFinalScore(score);
                    console.log('🎯 [TriviaPage] Final score calculated:', score, 'Time bonus:', timeBonus, 'Time solved:', timeSolved);
                    setGameState('result');
                }
            }
        } catch (err: any) {
            console.error('❌ [TriviaPage] Error submitting guess:', err);
            setError(err.message || 'Failed to submit guess');
        }
    };

    const resetGame = () => {
        stopTimer();
        setGameState('selection');
        setSelectedType(null);
        setSelectedDifficulty(null);
        setCurrentTrivia(null);
        setCurrentHints([]);
        setUserGuess('');
        setGuessResult(null);
        setHintLevel(1);
        setError(null);
        setFinalScore(0);
        setTimeRemaining(GAME_TIME_LIMIT);
        setTimeBonus(0);
        setTimeSolved(0);
        setGameStartTime(null);
    };

    const giveUp = () => {
        console.log('🏳️ [TriviaPage] giveUp() called, currentTrivia:', currentTrivia);
        console.log('🏳️ [TriviaPage] Current game state:', gameState);
        stopTimer();
        const timeSolved = calculateTimeSolved();
        setTimeSolved(timeSolved);
        
        if (currentTrivia) {
            const answer = selectedType === 'season' 
                ? `Season ${(currentTrivia as TriviaSeason).seasonNumber}`
                : (currentTrivia as TriviaPlayer | TriviaTeam).name;
            setGuessResult({
                correct: false,
                answer,
                message: 'Better luck next time!'
            });
        } else {
            // If no trivia data, still end the game
            setGuessResult({
                correct: false,
                answer: 'Unknown',
                message: 'Time ran out!'
            });
        }
        
        // Calculate score even when giving up (0 points for giving up)
        const score = 0;
        setFinalScore(score);
        setTimeBonus(0);
        console.log('🏳️ [TriviaPage] About to set game state to result');
        setGameState('result');
        console.log('🏳️ [TriviaPage] Game ended via giveUp()');
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
                        className={`type-btn ${selectedType === 'season' ? 'selected' : ''}`}
                        onClick={() => setSelectedType('season')}
                        disabled={true}
                        title="Coming soon - Season trivia is currently being fixed"
                    >
                        <span className="type-icon">S</span>
                        <span className="type-label">Season</span>
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
                    <div className="timer">
                        <span className={`timer-text ${timeRemaining <= 10 ? 'warning' : ''}`}>
                            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                        </span>
                    </div>
                </div>
            </div>
            <div className="hints-section">
                <h3>Hints:</h3>
                <div className="hints-list">
                    {currentHints.slice(0, hintLevel).map((hint, index) => (
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
                        <div className="score-display">
                            <h4>Your Score: <span className="score-value">{finalScore}</span></h4>
                            <div className="score-breakdown">
                                <p>Base Score ({selectedDifficulty}): <span className="score-detail">{BASE_SCORES[selectedDifficulty!]}</span></p>
                                <p>Free Hint (First letter): <span className="score-detail">0</span></p>
                                <p>Hint Penalty ({Math.max(hintLevel - 1, 0)} hints): <span className="score-detail">-{Math.max(hintLevel - 1, 0) * HINT_PENALTY}</span></p>
                                <p>Time Bonus ({timeRemaining}s remaining): <span className="score-detail">+{timeBonus}</span></p>
                                <p>Final Score: <span className="score-detail">{finalScore}</span></p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="incorrect-result">
                        <span className="result-icon">!</span>
                        <h3>The answer was:</h3>
                        <p className="correct-answer">{guessResult?.answer}</p>
                        <div className="score-display">
                            <h4>Your Score: <span className="score-value">{finalScore}</span></h4>
                            {finalScore > 0 ? (
                                <div className="score-breakdown">
                                    <p>Base Score ({selectedDifficulty}): <span className="score-detail">{BASE_SCORES[selectedDifficulty!]}</span></p>
                                    <p>Free Hint (First letter): <span className="score-detail">0</span></p>
                                    <p>Hint Penalty ({Math.max(hintLevel - 1, 0)} hints): <span className="score-detail">-{Math.max(hintLevel - 1, 0) * HINT_PENALTY}</span></p>
                                    <p>Time Bonus ({timeRemaining}s remaining): <span className="score-detail">+{timeBonus}</span></p>
                                    <p>Final Score: <span className="score-detail">{finalScore}</span></p>
                                </div>
                            ) : (
                                <p className="no-score">No points earned - try again!</p>
                            )}
                        </div>
                    </div>
                )}
                <div className="game-stats">
                    <p>Difficulty: <span className="stat-value">{selectedDifficulty}</span></p>
                    <p>Type: <span className="stat-value">{selectedType}</span></p>
                    <p>Hints used: <span className="stat-value">{hintLevel} / {currentTrivia?.hintCount || 0}</span></p>
                    <p>Total hints available: <span className="stat-value">{currentTrivia?.hintCount || 0}</span></p>
                    <p>Time solved: <span className="stat-value">{timeSolved}s</span></p>
                    <p>Time remaining: <span className="stat-value">{timeRemaining}s</span></p>
                    <p>Time bonus: <span className="stat-value">+{timeBonus} points</span></p>
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