import React, { useState } from 'react';
import '../styles/TriviaPage.css';
import { 
    TriviaPlayer, 
    TriviaTeam, 
    TriviaSeason, 
    Hint, 
    GuessResult, 
    TriviaData 
} from '../types/interfaces';

type GameState = 'selection' | 'playing' | 'result';

const TriviaPage: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>('selection');
    const [selectedType, setSelectedType] = useState<'player' | 'team' | 'season' | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
    const [currentTrivia, setCurrentTrivia] = useState<TriviaData | null>(null);
    const [currentHints, setCurrentHints] = useState<Hint[]>([]);
    const [userGuess, setUserGuess] = useState('');
    const [guessResult, setGuessResult] = useState<GuessResult | null>(null);
    const [hintLevel, setHintLevel] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const startGame = async () => {
        if (!selectedType || !selectedDifficulty) return;

        setIsLoading(true);
        setError(null);

        try {
            const endpoint = `/api/trivia/${selectedType}`;
            const response = await fetch(
                `${API_BASE}${endpoint}?difficulty=${selectedDifficulty}`
            );

            if (!response.ok) {
                throw new Error('Failed to get trivia item');
            }

            const triviaData: TriviaData = await response.json();
            setCurrentTrivia(triviaData);
            setGameState('playing');
            setHintLevel(1);
            setCurrentHints([]);
            setUserGuess('');
            setGuessResult(null);

            // Generate first hint
            generateHints(triviaData, selectedType, 1);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

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

    const generatePlayerHints = (player: TriviaPlayer, maxLevel: number): Hint[] => {
        const hints: Hint[] = [];
        
        // Level 1: First letter
        hints.push({
            text: `First letter: ${player.name.charAt(0)}`,
            level: 1
        });

        // Level 2: Position
        if (player.position && player.position !== "N/A") {
            hints.push({
                text: `Position: ${player.position}`,
                level: 2
            });
        }

        // Level 3: Number of teams
        if (player.teams && player.teams.length > 0) {
            hints.push({
                text: `Has played for ${player.teams.length} team(s)`,
                level: 3
            });
        }

        // Level 4: Awards
        if (player.awards && player.awards.length > 0) {
            hints.push({
                text: `Has won ${player.awards.length} award(s)`,
                level: 4
            });
        }

        // Level 5: Specific team names
        if (player.teams && player.teams.length > 0) {
            const teamNames = player.teams.map(t => t.name).join(', ');
            hints.push({
                text: `Teams: ${teamNames}`,
                level: 5
            });
        }

        return hints.slice(0, maxLevel);
    };

    const generateTeamHints = (team: TriviaTeam, maxLevel: number): Hint[] => {
        const hints: Hint[] = [];
        
        // Level 1: First letter
        hints.push({
            text: `First letter: ${team.name.charAt(0)}`,
            level: 1
        });

        // Level 2: Season
        if (team.season) {
            hints.push({
                text: `Played in Season ${team.season.seasonNumber}`,
                level: 2
            });
        }

        // Level 3: Placement
        if (team.placement && team.placement !== "Didnt make playoffs") {
            hints.push({
                text: `Placement: ${team.placement}`,
                level: 3
            });
        }

        // Level 4: Number of players
        if (team.players && team.players.length > 0) {
            hints.push({
                text: `Has ${team.players.length} player(s)`,
                level: 4
            });
        }

        // Level 5: Player names
        if (team.players && team.players.length > 0) {
            const playerNames = team.players.map(p => p.name).join(', ');
            hints.push({
                text: `Players: ${playerNames}`,
                level: 5
            });
        }

        return hints.slice(0, maxLevel);
    };

    const generateSeasonHints = (season: TriviaSeason, maxLevel: number): Hint[] => {
        const hints: Hint[] = [];
        
        // Level 1: Season number range
        const seasonNum = season.seasonNumber;
        if (seasonNum <= 5) {
            hints.push({
                text: 'Season number is 5 or lower',
                level: 1
            });
        } else if (seasonNum <= 10) {
            hints.push({
                text: 'Season number is between 6 and 10',
                level: 1
            });
        } else {
            hints.push({
                text: 'Season number is higher than 10',
                level: 1
            });
        }

        // Level 2: Theme
        if (season.theme && season.theme !== "None") {
            hints.push({
                text: `Theme: ${season.theme}`,
                level: 2
            });
        }

        // Level 3: Number of teams
        if (season.teams && season.teams.length > 0) {
            hints.push({
                text: `Has ${season.teams.length} team(s)`,
                level: 3
            });
        }

        // Level 4: Year
        const year = new Date(season.startDate).getFullYear();
        hints.push({
            text: `Started in ${year}`,
            level: 4
        });

        // Level 5: Team names
        if (season.teams && season.teams.length > 0) {
            const teamNames = season.teams.map(t => t.name).join(', ');
            hints.push({
                text: `Teams: ${teamNames}`,
                level: 5
            });
        }

        return hints.slice(0, maxLevel);
    };

    const submitGuess = async () => {
        if (!currentTrivia || !userGuess.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/api/trivia/guess`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: selectedType,
                    id: currentTrivia.id,
                    guess: userGuess.trim()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to validate guess');
            }

            const result: GuessResult = await response.json();
            setGuessResult(result);

            if (result.correct) {
                setGameState('result');
            } else {
                // Show next hint if available
                const nextLevel = hintLevel + 1;
                if (nextLevel <= currentTrivia.hintCount) {
                    setHintLevel(nextLevel);
                    generateHints(currentTrivia, selectedType!, nextLevel);
                } else {
                    // Out of hints, show result
                    setGameState('result');
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit guess');
        } finally {
            setIsLoading(false);
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
            <h1>Volleyball Trivia</h1>
            <p>Test your knowledge of RVL players, teams, and seasons!</p>
            
            <div className="selection-section">
                <h2>What would you like to guess?</h2>
                <div className="type-buttons">
                    <button
                        className={`type-btn ${selectedType === 'player' ? 'selected' : ''}`}
                        onClick={() => setSelectedType('player')}
                    >
                        <span className="type-icon">👤</span>
                        <span className="type-label">Player</span>
                    </button>
                    <button
                        className={`type-btn ${selectedType === 'team' ? 'selected' : ''}`}
                        onClick={() => setSelectedType('team')}
                    >
                        <span className="type-icon">🏆</span>
                        <span className="type-label">Team</span>
                    </button>
                    <button
                        className={`type-btn ${selectedType === 'season' ? 'selected' : ''}`}
                        onClick={() => setSelectedType('season')}
                    >
                        <span className="type-icon">📅</span>
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
                        >
                            Easy
                        </button>
                        <button
                            className={`difficulty-btn medium ${selectedDifficulty === 'medium' ? 'selected' : ''}`}
                            onClick={() => setSelectedDifficulty('medium')}
                        >
                            Medium
                        </button>
                        <button
                            className={`difficulty-btn hard ${selectedDifficulty === 'hard' ? 'selected' : ''}`}
                            onClick={() => setSelectedDifficulty('hard')}
                        >
                            Hard
                        </button>
                    </div>
                </div>
            )}

            {selectedType && selectedDifficulty && (
                <button 
                    className="start-game-btn"
                    onClick={startGame}
                    disabled={isLoading}
                >
                    {isLoading ? 'Loading...' : 'Start Game!'}
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
                    disabled={isLoading}
                />
                <div className="guess-buttons">
                    <button 
                        className="submit-btn"
                        onClick={submitGuess}
                        disabled={!userGuess.trim() || isLoading}
                    >
                        {isLoading ? 'Checking...' : 'Submit Guess'}
                    </button>
                    <button 
                        className="give-up-btn"
                        onClick={giveUp}
                        disabled={isLoading}
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
                        <span className="result-icon">🎉</span>
                        <h3>Congratulations!</h3>
                        <p>You guessed correctly!</p>
                    </div>
                ) : (
                    <div className="incorrect-result">
                        <span className="result-icon">💡</span>
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

    return (
        <div className="trivia-page">
            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {gameState === 'selection' && renderSelectionScreen()}
            {gameState === 'playing' && renderGameScreen()}
            {gameState === 'result' && renderResultScreen()}
        </div>
    );
};

export default TriviaPage; 