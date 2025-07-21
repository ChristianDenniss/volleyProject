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
        setCurrentHints(hints);
    };

    // Hint generators (same as before)
    const generatePlayerHints = (player: TriviaPlayer, maxLevel: number): Hint[] => {
        const hints: Hint[] = [];
        hints.push({ text: `First letter: ${player.name.charAt(0)}`, level: 1 });
        if (player.position && player.position !== "N/A") {
            hints.push({ text: `Position: ${player.position}`, level: 2 });
        }
        if (player.teams && player.teams.length > 0) {
            hints.push({ text: `Has played for ${player.teams.length} team(s)`, level: 3 });
        }
        if (player.awards && player.awards.length > 0) {
            hints.push({ text: `Has won ${player.awards.length} award(s)`, level: 4 });
        }
        if (player.teams && player.teams.length > 0) {
            const teamNames = player.teams.map(t => t.name).join(', ');
            hints.push({ text: `Teams: ${teamNames}`, level: 5 });
        }
        return hints.slice(0, maxLevel);
    };
    const generateTeamHints = (team: TriviaTeam, maxLevel: number): Hint[] => {
        const hints: Hint[] = [];
        hints.push({ text: `First letter: ${team.name.charAt(0)}`, level: 1 });
        if (team.season) {
            hints.push({ text: `Played in Season ${team.season.seasonNumber}`, level: 2 });
        }
        if (team.placement && team.placement !== "Didnt make playoffs") {
            hints.push({ text: `Placement: ${team.placement}`, level: 3 });
        }
        if (team.players && team.players.length > 0) {
            hints.push({ text: `Has ${team.players.length} player(s)`, level: 4 });
        }
        if (team.players && team.players.length > 0) {
            const playerNames = team.players.map(p => p.name).join(', ');
            hints.push({ text: `Players: ${playerNames}`, level: 5 });
        }
        return hints.slice(0, maxLevel);
    };
    const generateSeasonHints = (season: TriviaSeason, maxLevel: number): Hint[] => {
        const hints: Hint[] = [];
        const seasonNum = season.seasonNumber;
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
        const year = new Date(season.startDate).getFullYear();
        hints.push({ text: `Started in ${year}`, level: 4 });
        if (season.teams && season.teams.length > 0) {
            const teamNames = season.teams.map(t => t.name).join(', ');
            hints.push({ text: `Teams: ${teamNames}`, level: 5 });
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
                        className={`type-btn ${selectedType === 'season' ? 'selected' : ''}`}
                        onClick={() => setSelectedType('season')}
                        disabled={debounce}
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
                    <p>Hints used: <span className="stat-value">{hintLevel}</span></p>
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
    
    return (
        <div className={`trivia-page ${isLoading ? 'loading' : ''}`}>
            {hasError && (
                <div className="error-message">
                    <h3>Error</h3>
                    <p>{hasError}</p>
                    <button onClick={() => setError(null)}>Dismiss</button>
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