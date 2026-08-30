/**
 * TriviaPage — the guess-the-player/team game: pick a subject and a difficulty, then work through
 * progressively revealing hints against a 60-second clock.
 * Scoring is the difficulty's base score, minus a penalty per hint beyond the free first letter, plus a bonus for each second left on the clock — the result screen shows that breakdown line by line rather than only the total, so the score is explainable.
 * Lives in `components/`; routed at /trivia.
 */
import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import type {
    TriviaPlayer,
    TriviaTeam,
    TriviaSeason,
    Hint,
    GuessResult,
    TriviaData,
} from '@/types/interfaces';
import { useTriviaPlayer, useTriviaTeam, useTriviaSeason, useSubmitTriviaGuess } from '@/hooks/allFetch';

import PageContainer from '@/components/ui/layout/PageContainer';
import PageHeader from '@/components/ui/layout/PageHeader';
import SectionHeader from '@/components/ui/layout/SectionHeader';
import Card from '@/components/ui/layout/Card';
import DetailStats, { type DetailStatItem } from '@/components/ui/layout/DetailStats';
import Button from '@/components/ui/buttons/Button';
import Pill, { type PillTone } from '@/components/ui/pills/Pill';
import TextInput from '@/components/ui/inputs/TextInput';
import ErrorNotice from '@/components/ui/feedback/ErrorNotice';
import { PageLoader } from '@/components/ui/feedback/LoadingSpinner';

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

    const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            submitGuess();
        }
    };

    /** Difficulty to chip colour, so "impossible" reads as harder at a glance. */
    const DIFFICULTY_TONES: Record<Difficulty, PillTone> = {
        easy: 'success',
        medium: 'info',
        hard: 'warning',
        impossible: 'danger',
    };

    const TYPE_CHOICES: { value: TriviaType; label: string; disabled?: boolean; note?: string }[] = [
        { value: 'player', label: 'Player' },
        { value: 'team', label: 'Team' },
        // Season trivia is temporarily withdrawn; the button stays visible with its reason
        // rather than disappearing, so the option is known to exist.
        {
            value: 'season',
            label: 'Season',
            disabled: true,
            note: 'Coming soon - Season trivia is currently being fixed',
        },
    ];

    const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'impossible'];

    /** The score breakdown, shared by both result outcomes. */
    const scoreBreakdown = (): DetailStatItem[] => [
        { label: `Base Score (${selectedDifficulty})`, value: BASE_SCORES[selectedDifficulty!] },
        { label: 'Free Hint (first letter)', value: 0 },
        {
            label: `Hint Penalty (${Math.max(hintLevel - 1, 0)} hints)`,
            value: `-${Math.max(hintLevel - 1, 0) * HINT_PENALTY}`,
        },
        { label: `Time Bonus (${timeRemaining}s remaining)`, value: `+${timeBonus}` },
        { label: 'Final Score', value: finalScore },
    ];

    const renderSelectionScreen = () => (
        <div className="flex flex-col gap-6">
            <p className="m-0 text-content-secondary">
                Test your knowledge of RVL players, teams, and seasons.
            </p>

            <section className="flex flex-col gap-3">
                <SectionHeader title="What would you like to guess?" level={3} />
                <div className="flex flex-wrap gap-3">
                    {TYPE_CHOICES.map((choice) => (
                        <button
                            key={choice.value}
                            type="button"
                            title={choice.note}
                            disabled={choice.disabled || debounce}
                            onClick={() => setSelectedType(choice.value)}
                            className={`flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                                selectedType === choice.value
                                    ? 'border-accent bg-brand-subtle text-accent'
                                    : 'border-border bg-surface text-content-secondary hover:border-border-strong'
                            }`}
                        >
                            <span className="text-2xl font-bold">{choice.label.charAt(0)}</span>
                            <span className="text-sm font-medium">{choice.label}</span>
                        </button>
                    ))}
                </div>
            </section>

            {selectedType && (
                <section className="flex flex-col gap-3">
                    <SectionHeader title="Choose difficulty" level={3} />
                    <div className="flex flex-wrap gap-2">
                        {DIFFICULTIES.map((difficulty) => (
                            <Button
                                key={difficulty}
                                variant={selectedDifficulty === difficulty ? 'primary' : 'secondary'}
                                disabled={debounce}
                                onClick={() => setSelectedDifficulty(difficulty)}
                                className="capitalize"
                            >
                                {difficulty}
                            </Button>
                        ))}
                    </div>
                </section>
            )}

            {selectedType && selectedDifficulty && (
                <Button
                    size="lg"
                    className="self-start"
                    loading={debounce}
                    loadingLabel="Please wait..."
                    onClick={startGame}
                >
                    Start Game!
                </Button>
            )}
        </div>
    );

    const renderGameScreen = () => (
        <div className="flex flex-col gap-5">
            <SectionHeader
                title={`Guess the ${selectedType}`}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <Pill tone={DIFFICULTY_TONES[selectedDifficulty!]} className="capitalize">
                            {selectedDifficulty}
                        </Pill>
                        <Pill tone="neutral">
                            Hint {hintLevel}/{currentTrivia?.hintCount}
                        </Pill>
                        <span
                            className={`text-lg font-bold tabular-nums ${timeRemaining <= 10 ? 'text-status-danger' : 'text-content'}`}
                        >
                            {Math.floor(timeRemaining / 60)}:
                            {(timeRemaining % 60).toString().padStart(2, '0')}
                        </span>
                    </div>
                }
            />

            <section className="flex flex-col gap-2">
                <SectionHeader title="Hints" level={4} />
                <ol className="m-0 flex list-none flex-col gap-2 p-0">
                    {currentHints.slice(0, hintLevel).map((hint, index) => (
                        <li
                            key={index}
                            className="rounded-card border border-brand-muted bg-brand-subtle px-4 py-3 text-sm text-content"
                        >
                            {hint.text}
                        </li>
                    ))}
                </ol>
            </section>

            <div className="flex flex-col gap-3">
                <TextInput
                    value={userGuess}
                    onChange={(e) => setUserGuess(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Enter your guess..."
                    aria-label="Your guess"
                    disabled={debounce}
                />
                <div className="flex flex-wrap gap-2">
                    <Button
                        disabled={!userGuess.trim()}
                        loading={debounce}
                        loadingLabel="Please wait..."
                        onClick={submitGuess}
                    >
                        Submit Guess
                    </Button>
                    <Button variant="outline" onClick={giveUp}>
                        Give Up
                    </Button>
                </div>
            </div>

            {guessResult && !guessResult.correct && (
                <ErrorNotice tone="warning" message={guessResult.message} />
            )}
        </div>
    );

    const renderResultScreen = () => {
        const correct = Boolean(guessResult?.correct);

        const gameStats: DetailStatItem[] = [
            { label: 'Difficulty', value: selectedDifficulty },
            { label: 'Type', value: selectedType },
            { label: 'Hints used', value: `${hintLevel} / ${currentTrivia?.hintCount || 0}` },
            { label: 'Total hints available', value: currentTrivia?.hintCount || 0 },
            { label: 'Time solved', value: `${timeSolved}s` },
            { label: 'Time remaining', value: `${timeRemaining}s` },
            { label: 'Time bonus', value: `+${timeBonus} points` },
        ];

        if (currentTrivia && selectedType === 'player') {
            gameStats.push({ label: 'Player name', value: (currentTrivia as TriviaPlayer).name });
            if ((currentTrivia as TriviaPlayer).position) {
                gameStats.push({
                    label: 'Position',
                    value: (currentTrivia as TriviaPlayer).position,
                });
            }
        }
        if (currentTrivia && selectedType === 'team') {
            gameStats.push({ label: 'Team name', value: (currentTrivia as TriviaTeam).name });
            gameStats.push({ label: 'Placement', value: (currentTrivia as TriviaTeam).placement });
        }
        if (currentTrivia && selectedType === 'season') {
            gameStats.push({
                label: 'Season number',
                value: (currentTrivia as TriviaSeason).seasonNumber,
            });
        }

        return (
            <div className="flex flex-col gap-5">
                <SectionHeader title="Game Over!" />

                <Card padding="lg" tone={correct ? 'accent' : 'surface'}>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <span
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl font-bold ${
                                    correct
                                        ? 'bg-status-success/15 text-status-success'
                                        : 'bg-status-danger/15 text-status-danger'
                                }`}
                            >
                                {correct ? 'OK' : '!'}
                            </span>
                            <div className="flex min-w-0 flex-col">
                                <h3 className="m-0 text-lg font-semibold text-content">
                                    {correct ? 'Congratulations!' : 'The answer was:'}
                                </h3>
                                <p className="m-0 text-sm text-content-secondary">
                                    {correct ? 'You guessed correctly!' : guessResult?.answer}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <p className="m-0 text-2xl font-bold tabular-nums text-content">
                                Your Score: {finalScore}
                            </p>
                            {correct || finalScore > 0 ? (
                                <DetailStats columns={3} items={scoreBreakdown()} />
                            ) : (
                                <p className="m-0 text-sm text-content-muted">
                                    No points earned - try again!
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                <Card padding="lg">
                    <SectionHeader title="Game stats" level={4} className="mb-4" />
                    <DetailStats columns={3} items={gameStats} />
                </Card>

                <Button className="self-start" onClick={resetGame}>
                    Play Again
                </Button>
            </div>
        );
    };

    const isLoading = triviaPlayer.loading || triviaTeam.loading || triviaSeason.loading;
    const hasError = triviaPlayer.error || triviaTeam.error || triviaSeason.error || error;

    /** Clearing an error means retrying the fetch that produced it. */
    const dismissError = () => {
        setError(null);
        if (selectedDifficulty) {
            triviaPlayer.fetchTriviaPlayer();
            triviaTeam.fetchTriviaTeam();
            triviaSeason.fetchTriviaSeason();
        }
    };

    return (
        <PageContainer width="narrow">
            <PageHeader title="RVL Trivia" />

            {hasError && (
                <ErrorNotice
                    title="Error"
                    message={hasError}
                    action={
                        <Button variant="secondary" size="sm" onClick={dismissError}>
                            Dismiss
                        </Button>
                    }
                />
            )}

            {isLoading && gameState === 'playing' ? (
                <PageLoader message="Loading trivia..." />
            ) : (
                <>
                    {gameState === 'selection' && renderSelectionScreen()}
                    {gameState === 'playing' && renderGameScreen()}
                    {gameState === 'result' && renderResultScreen()}
                </>
            )}
        </PageContainer>
    );
};

export default TriviaPage; 