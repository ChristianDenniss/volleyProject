import React, { useState, useRef, useEffect } from 'react';
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

/* The watermark was a ::before; it stays a pseudo-element. bg-trivia-marks is
   the data-URL registered in tailwind.css (nested url()/rotate() parens). */
const pageShell =
    "w-full relative pb-[3rem] " +
    "before:content-[''] before:absolute before:inset-0 before:pointer-events-none before:z-[0] " +
    "before:bg-trivia-marks before:bg-repeat";

const triviaPage =
    "max-w-[1200px] mx-auto p-[2rem] [font-family:'Inter',sans-serif] text-text box-border relative z-[1] " +
    "upto-md:p-[1rem]";

const triviaSelection = "text-center";

const triviaLead =
    "text-[1.2rem] text-[#7f8c8d] mt-0 mx-0 mb-[3rem] font-normal " +
    "upto-md:text-[1.05rem] upto-md:mb-[2rem]";

const selectionSection =
    "mb-[3rem] last:mb-0 " +
    "[&_h2]:text-[1.5rem] [&_h2]:text-text [&_h2]:mb-[2rem] [&_h2]:font-semibold";

const typeButtons = "flex justify-center gap-[2rem] flex-wrap upto-md:flex-col upto-md:items-center";

const typeLabel = "text-[1.1rem] font-semibold tracking-[0.02em]";

const difficultyButtons = "flex justify-center gap-[1.5rem] flex-wrap upto-md:flex-col upto-md:items-center";

const startGameBtn =
    "py-[1.2rem] px-[3rem] text-[1.2rem] font-semibold " +
    "bg-[linear-gradient(135deg,var(--color-brand-primary),var(--color-brand-primary-hover))] " +
    "text-white border-none rounded-[8px] cursor-pointer transition-all duration-300 ease-[ease] " +
    "shadow-[0_4px_15px_rgba(45,60,80,0.3)] tracking-[0.02em] " +
    "hover:enabled:[transform:translateY(-3px)] hover:enabled:shadow-[0_8px_25px_rgba(45,60,80,0.4)] " +
    "disabled:opacity-60 disabled:cursor-not-allowed";

const triviaGame =
    "bg-white rounded-[12px] py-[3rem] px-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.1)] my-[2rem] mx-0 " +
    "upto-md:py-[2rem] upto-md:px-[1.5rem]";

const gameHeader =
    "flex justify-between items-center mb-[2.5rem] pb-[1.5rem] border-b-2 border-b-[#f8f9fa] " +
    "upto-md:flex-col upto-md:gap-[1rem] upto-md:text-center " +
    "[&_h2]:text-[2rem] [&_h2]:text-text [&_h2]:m-0 [&_h2]:font-bold";

const gameInfo = "flex gap-[1rem] items-center";

const hintCounter =
    "py-[0.5rem] px-[1rem] bg-[#f8f9fa] rounded-[20px] text-[0.85rem] font-semibold text-[#7f8c8d] border border-[#e0e0e0]";

const timer =
    "bg-[#f8f9fa] py-[0.5rem] px-[1rem] rounded-[20px] border border-[#e0e0e0] flex items-center gap-[0.5rem]";

const hintsSection =
    "mb-[2.5rem] " +
    "[&_h3]:text-[1.3rem] [&_h3]:text-text [&_h3]:mb-[1.5rem] [&_h3]:font-semibold";

const hintsList = "flex flex-col gap-[1rem]";

const guessSection = "mb-[1.5rem]";

const guessInput =
    "w-full p-[1.2rem] text-[1.1rem] border-2 border-[#e0e0e0] rounded-[8px] mb-[1.5rem] " +
    "transition-all duration-300 ease-[ease] font-inherit box-border " +
    "focus:outline-none focus:border-brand-primary focus:shadow-[0_0_0_3px_rgba(45,60,80,0.1)] " +
    "disabled:bg-[#f8f9fa] disabled:cursor-not-allowed disabled:opacity-70";

const guessButtons = "flex gap-[1rem] justify-center upto-md:flex-col upto-md:items-center";

const submitBtn =
    "py-[1rem] px-[2.5rem] bg-brand-primary text-text-on-brand border-none rounded-[8px] " +
    "text-[1rem] font-semibold cursor-pointer transition-all duration-300 ease-[ease] " +
    "shadow-[0_4px_15px_rgba(45,60,80,0.3)] " +
    "hover:enabled:bg-brand-primary-hover hover:enabled:[transform:translateY(-2px)] " +
    "hover:enabled:shadow-[0_6px_20px_rgba(45,60,80,0.4)] " +
    "disabled:opacity-60 disabled:cursor-not-allowed " +
    "upto-md:w-full upto-md:max-w-[200px]";

const giveUpBtn =
    "py-[1rem] px-[2.5rem] bg-[linear-gradient(135deg,#e74c3c,#c0392b)] text-white border-none rounded-[8px] " +
    "text-[1rem] font-semibold cursor-pointer transition-all duration-300 ease-[ease] " +
    "shadow-[0_4px_15px_rgba(231,76,60,0.3)] " +
    "hover:enabled:[transform:translateY(-2px)] hover:enabled:shadow-[0_6px_20px_rgba(231,76,60,0.4)] " +
    "disabled:opacity-60 disabled:cursor-not-allowed " +
    "upto-md:w-full upto-md:max-w-[200px]";

const incorrectMessage =
    "p-[1rem] bg-[rgba(231,76,60,0.1)] text-[#e74c3c] rounded-[8px] text-center font-semibold mt-[1rem] " +
    "border border-[rgba(231,76,60,0.2)] animate-trivia-shake";

const triviaResult =
    "text-center bg-white rounded-[12px] py-[3rem] px-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.1)] my-[2rem] mx-0 " +
    "[&_h2]:text-[2.5rem] [&_h2]:text-text [&_h2]:mb-[2rem] [&_h2]:font-bold";

const resultContent = "mb-[3rem]";

const correctResult =
    "mb-[2rem] [&_h3]:text-[1.8rem] [&_h3]:text-success [&_h3]:mb-[0.5rem] [&_h3]:font-semibold";

const incorrectResult =
    "mb-[2rem] [&_h3]:text-[1.8rem] [&_h3]:text-[#e74c3c] [&_h3]:mb-[0.5rem] [&_h3]:font-semibold";

const correctAnswer =
    "text-[1.5rem] font-semibold text-text bg-[#f8f9fa] py-[1rem] px-[1.5rem] rounded-[8px] " +
    "inline-block mt-[0.5rem] border border-[#e0e0e0]";

const scoreDisplay =
    "my-[2rem] mx-0 p-[1.5rem] bg-[linear-gradient(135deg,#f8f9fa_0%,#e9ecef_100%)] rounded-[12px] " +
    "border-2 border-[#e0e0e0] shadow-[0_4px_12px_rgba(0,0,0,0.1)] " +
    "[&_h4]:text-[1.8rem] [&_h4]:font-bold [&_h4]:text-brand-primary [&_h4]:mb-[1rem] [&_h4]:text-center";

const scoreValue = "text-success text-[2.2rem] [font-weight:800] [text-shadow:0_2px_4px_rgba(0,0,0,0.1)]";

const scoreBreakdown =
    "bg-white p-[1rem] rounded-[8px] border border-[#e0e0e0] mt-[1rem] " +
    "[&_p]:my-[0.5rem] [&_p]:mx-0 [&_p]:text-[1rem] [&_p]:text-text [&_p]:flex [&_p]:justify-between [&_p]:items-center " +
    "[&_p:last-child]:border-t-2 [&_p:last-child]:border-t-[#e0e0e0] [&_p:last-child]:pt-[0.5rem] " +
    "[&_p:last-child]:mt-[0.5rem] [&_p:last-child]:font-bold [&_p:last-child]:text-[1.1rem]";

const scoreDetail = "font-semibold text-brand-primary";

const noScore = "text-center text-[#7f8c8d] italic my-[1rem] mx-0";

/* `*` + !important forced every descendant to brand-primary so stats stayed
   visible against whatever else was in the cascade. */
const gameStats =
    "bg-[#f8f9fa] p-[2rem] rounded-[8px] text-left max-w-[800px] min-w-[600px] mx-auto border border-[#e0e0e0] " +
    "[&_*]:!text-brand-primary [&_p]:my-[0.5rem] [&_p]:mx-0 [&_p]:text-[1rem]";

const statValue = "font-semibold";

const resultButtons = "mt-[2rem]";

const playAgainBtn =
    "py-[1.2rem] px-[3rem] text-[1.2rem] font-semibold " +
    "bg-[linear-gradient(135deg,var(--color-brand-primary),var(--color-brand-primary-hover))] " +
    "text-white border-none rounded-[8px] cursor-pointer transition-all duration-300 ease-[ease] " +
    "shadow-[0_4px_15px_rgba(45,60,80,0.3)] " +
    "hover:[transform:translateY(-3px)] hover:shadow-[0_8px_25px_rgba(45,60,80,0.4)]";

const errorMessage =
    "bg-[rgba(231,76,60,0.1)] text-[#e74c3c] py-[1.5rem] px-[2rem] rounded-[8px] my-[2rem] mx-0 " +
    "flex justify-between items-center animate-trivia-slide-in border border-[rgba(231,76,60,0.2)] " +
    "[&_button]:[background:none] [&_button]:border-none [&_button]:text-[#e74c3c] [&_button]:text-[1.5rem] " +
    "[&_button]:cursor-pointer [&_button]:p-0 [&_button]:w-[30px] [&_button]:h-[30px] " +
    "[&_button]:flex [&_button]:items-center [&_button]:justify-center [&_button]:rounded-[50%] " +
    "[&_button]:transition-[background] [&_button]:duration-300 [&_button]:ease-[ease] " +
    "[&_button:hover]:bg-[rgba(231,76,60,0.1)]";

const loadingMessage =
    "bg-[linear-gradient(135deg,var(--color-brand-primary),var(--color-brand-primary-hover))] text-white " +
    "py-[3rem] px-[2rem] rounded-[12px] text-center mb-[2rem] shadow-[0_4px_15px_rgba(45,60,80,0.3)] " +
    "animate-trivia-slide-in-out " +
    "[&_h3]:text-[1.5rem] [&_h3]:mb-[1rem] [&_h3]:font-semibold " +
    "[&_p]:text-[1.1rem] [&_p]:opacity-90 [&_p]:m-0";

const DIFFICULTY_CHROME: Record<Difficulty, { idle: string; selected: string; badge: string }> = {
    easy: {
        idle: "bg-white border-success text-success",
        selected: "border-success bg-success text-white",
        badge: "bg-[rgba(39,174,96,0.1)] text-success border border-[rgba(39,174,96,0.2)]",
    },
    medium: {
        idle: "bg-white border-warning text-warning",
        selected: "border-warning bg-warning text-white",
        badge: "bg-[rgba(243,156,18,0.1)] text-warning border border-[rgba(243,156,18,0.2)]",
    },
    hard: {
        idle: "bg-white border-[#e74c3c] text-[#e74c3c]",
        selected: "border-[#e74c3c] bg-[#e74c3c] text-white",
        badge: "bg-[rgba(231,76,60,0.1)] text-[#e74c3c] border border-[rgba(231,76,60,0.2)]",
    },
    impossible: {
        idle: "bg-white border-[#8e44ad] text-[#8e44ad]",
        selected: "border-[#8e44ad] bg-[#8e44ad] text-white",
        badge: "bg-[rgba(142,68,173,0.1)] text-[#8e44ad] border border-[rgba(142,68,173,0.2)]",
    },
};

/* :disabled outranks :hover and .selected for transform (same spec, later). */
function typeBtnClasses(selected: boolean, disabled: boolean) {
    const base =
        "group flex flex-col items-center py-[2.5rem] px-[2rem] border-2 rounded-[12px] " +
        "cursor-pointer transition-all duration-300 ease-[ease] min-w-[160px] relative overflow-hidden " +
        "before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[4px] " +
        "before:transition-[transform] before:duration-300 before:ease-[ease] " +
        "disabled:opacity-60 disabled:cursor-not-allowed upto-md:min-w-[200px]";
    const lift = disabled
        ? ""
        : selected
            ? "[transform:translateY(-4px)]"
            : "hover:[transform:translateY(-4px)]";
    if (selected) {
        return (
            `${base} ${lift} border-brand-primary text-white ` +
            "bg-[linear-gradient(135deg,var(--color-brand-primary),var(--color-brand-primary-hover))] " +
            "shadow-[0_8px_25px_rgba(45,60,80,0.3)] before:bg-white before:[transform:scaleX(1)]"
        );
    }
    return (
        `${base} ${lift} border-[#e0e0e0] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] ` +
        "before:bg-brand-primary before:[transform:scaleX(0)] hover:before:[transform:scaleX(1)] " +
        "hover:shadow-[0_8px_25px_rgba(0,0,0,0.2)] hover:border-brand-primary"
    );
}

/* .selected outranks :hover for colour; hover still supplies the scale. */
function typeIconClasses(selected: boolean) {
    const base =
        "text-[3.5rem] mb-[1rem] transition-[transform] duration-300 ease-[ease] font-bold " +
        "[font-family:'Inter',sans-serif] flex items-center justify-center w-[80px] h-[80px] " +
        "rounded-[50%] border-2 group-hover:[transform:scale(1.1)]";
    if (selected) {
        return `${base} bg-white text-brand-primary border-white`;
    }
    return (
        `${base} bg-[#f8f9fa] text-text border-[#e0e0e0] ` +
        "group-hover:bg-brand-primary group-hover:text-white group-hover:border-brand-primary"
    );
}

function difficultyBtnClasses(level: Difficulty, selected: boolean, disabled: boolean) {
    const base =
        "py-[1rem] px-[2.5rem] border-2 rounded-[8px] cursor-pointer " +
        "transition-all duration-300 ease-[ease] text-[1rem] font-semibold min-w-[120px] relative overflow-hidden " +
        "before:content-[''] before:absolute before:inset-0 before:bg-current before:opacity-0 " +
        "before:transition-[opacity] before:duration-300 before:ease-[ease] " +
        "disabled:opacity-60 disabled:cursor-not-allowed upto-md:min-w-[150px]";
    const lift = disabled
        ? ""
        : selected
            ? "[transform:translateY(-2px)] shadow-[0_4px_15px_rgba(0,0,0,0.2)]"
            : "hover:[transform:translateY(-2px)] hover:shadow-[0_4px_15px_rgba(0,0,0,0.2)]";
    const chrome = selected ? DIFFICULTY_CHROME[level].selected : DIFFICULTY_CHROME[level].idle;
    return `${base} ${lift} ${chrome}`;
}

function difficultyBadgeClasses(level: Difficulty | null) {
    const base =
        "py-[0.5rem] px-[1rem] rounded-[20px] text-[0.85rem] font-semibold uppercase tracking-[0.05em]";
    if (!level) return base;
    return `${base} ${DIFFICULTY_CHROME[level].badge}`;
}

function hintClasses(level: number) {
    const base =
        "p-[1.2rem] rounded-[8px] text-[1rem] font-medium transition-all duration-300 ease-[ease] border-l-4 relative";
    switch (level) {
        case 1:
            return `${base} bg-[rgba(39,174,96,0.05)] text-success border-l-success`;
        case 2:
            return `${base} bg-[rgba(243,156,18,0.05)] text-warning border-l-warning`;
        case 3:
            return `${base} bg-[rgba(231,76,60,0.05)] text-[#e74c3c] border-l-[#e74c3c]`;
        case 4:
            return `${base} bg-[rgba(52,152,219,0.05)] text-brand-primary-hover border-l-brand-primary-hover`;
        case 5:
            return `${base} bg-[rgba(155,89,182,0.05)] text-[#9b59b6] border-l-[#9b59b6]`;
        default:
            return base;
    }
}

function timerTextClasses(warning: boolean) {
    const base =
        "text-[1.1rem] font-bold [font-family:'Courier_New',monospace] tracking-[1px]";
    return warning ? `${base} text-warning animate-trivia-pulse` : `${base} text-brand-primary`;
}

/* display:flex / font-size:3rem / margin:0 auto 1rem win over the earlier
   display:block / font-size:4rem / margin-bottom:1rem on the same rule. */
function resultIconClasses(correct: boolean) {
    const base =
        "text-[3rem] font-bold [font-family:'Inter',sans-serif] w-[100px] h-[100px] rounded-[50%] " +
        "flex items-center justify-center mx-auto mt-0 mb-[1rem]";
    return correct
        ? `${base} bg-[rgba(39,174,96,0.1)] text-success border-[3px] border-success`
        : `${base} bg-[rgba(231,76,60,0.1)] text-[#e74c3c] border-[3px] border-[#e74c3c]`;
}

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
        <div className={triviaSelection}>
            <p className={triviaLead}>Test your knowledge of RVL players, teams, and seasons...</p>
            <div className={selectionSection}>
                <h2>What would you like to guess?</h2>
                <div className={typeButtons}>
                    <button
                        className={typeBtnClasses(selectedType === 'player', debounce)}
                        onClick={() => setSelectedType('player')}
                        disabled={debounce}
                    >
                        <span className={typeIconClasses(selectedType === 'player')}>P</span>
                        <span className={typeLabel}>Player</span>
                    </button>
                    <button
                        className={typeBtnClasses(selectedType === 'team', debounce)}
                        onClick={() => setSelectedType('team')}
                        disabled={debounce}
                    >
                        <span className={typeIconClasses(selectedType === 'team')}>T</span>
                        <span className={typeLabel}>Team</span>
                    </button>
                    <button
                        className={typeBtnClasses(selectedType === 'season', true)}
                        onClick={() => setSelectedType('season')}
                        disabled={true}
                        title="Coming soon - Season trivia is currently being fixed"
                    >
                        <span className={typeIconClasses(selectedType === 'season')}>S</span>
                        <span className={typeLabel}>Season</span>
                    </button>
                </div>
            </div>
            {selectedType && (
                <div className={selectionSection}>
                    <h2>Choose difficulty:</h2>
                    <div className={difficultyButtons}>
                        <button
                            className={difficultyBtnClasses('easy', selectedDifficulty === 'easy', debounce)}
                            onClick={() => setSelectedDifficulty('easy')}
                            disabled={debounce}
                        >
                            Easy
                        </button>
                        <button
                            className={difficultyBtnClasses('medium', selectedDifficulty === 'medium', debounce)}
                            onClick={() => setSelectedDifficulty('medium')}
                            disabled={debounce}
                        >
                            Medium
                        </button>
                        <button
                            className={difficultyBtnClasses('hard', selectedDifficulty === 'hard', debounce)}
                            onClick={() => setSelectedDifficulty('hard')}
                            disabled={debounce}
                        >
                            Hard
                        </button>
                        <button
                            className={difficultyBtnClasses('impossible', selectedDifficulty === 'impossible', debounce)}
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
                    className={startGameBtn}
                    onClick={startGame}
                    disabled={debounce}
                >
                    {debounce ? 'Please wait...' : 'Start Game!'}
                </button>
            )}
        </div>
    );

    const renderGameScreen = () => (
        <div className={triviaGame}>
            <div className={gameHeader}>
                <h2>Guess the {selectedType}</h2>
                <div className={gameInfo}>
                    <span className={difficultyBadgeClasses(selectedDifficulty)}>{selectedDifficulty}</span>
                    <span className={hintCounter}>Hint {hintLevel}/{currentTrivia?.hintCount}</span>
                    <div className={timer}>
                        <span className={timerTextClasses(timeRemaining <= 10)}>
                            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                        </span>
                    </div>
                </div>
            </div>
            <div className={hintsSection}>
                <h3>Hints:</h3>
                <div className={hintsList}>
                    {currentHints.slice(0, hintLevel).map((hint, index) => (
                        <div key={index} className={hintClasses(hint.level)}>
                            {hint.text}
                        </div>
                    ))}
                </div>
            </div>
            <div className={guessSection}>
                <input
                    type="text"
                    value={userGuess}
                    onChange={(e) => setUserGuess(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Enter your guess...`}
                    className={guessInput}
                    disabled={debounce}
                />
                <div className={guessButtons}>
                    <button 
                        className={submitBtn}
                        onClick={submitGuess}
                        disabled={!userGuess.trim() || debounce}
                    >
                        {debounce ? 'Please wait...' : 'Submit Guess'}
                    </button>
                    <button 
                        className={giveUpBtn}
                        onClick={giveUp}
                    >
                        Give Up
                    </button>
                </div>
            </div>
            {guessResult && !guessResult.correct && (
                <div className={incorrectMessage}>
                    {guessResult.message}
                </div>
            )}
        </div>
    );

    const renderResultScreen = () => (
        <div className={triviaResult}>
            <h2>Game Over!</h2>
            <div className={resultContent}>
                {guessResult?.correct ? (
                    <div className={correctResult}>
                        <span className={resultIconClasses(true)}>✓</span>
                        <h3>Congratulations!</h3>
                        <p>You guessed correctly!</p>
                        <div className={scoreDisplay}>
                            <h4>Your Score: <span className={scoreValue}>{finalScore}</span></h4>
                            <div className={scoreBreakdown}>
                                <p>Base Score ({selectedDifficulty}): <span className={scoreDetail}>{BASE_SCORES[selectedDifficulty!]}</span></p>
                                <p>Free Hint (First letter): <span className={scoreDetail}>0</span></p>
                                <p>Hint Penalty ({Math.max(hintLevel - 1, 0)} hints): <span className={scoreDetail}>-{Math.max(hintLevel - 1, 0) * HINT_PENALTY}</span></p>
                                <p>Time Bonus ({timeRemaining}s remaining): <span className={scoreDetail}>+{timeBonus}</span></p>
                                <p>Final Score: <span className={scoreDetail}>{finalScore}</span></p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={incorrectResult}>
                        <span className={resultIconClasses(false)}>!</span>
                        <h3>The answer was:</h3>
                        <p className={correctAnswer}>{guessResult?.answer}</p>
                        <div className={scoreDisplay}>
                            <h4>Your Score: <span className={scoreValue}>{finalScore}</span></h4>
                            {finalScore > 0 ? (
                                <div className={scoreBreakdown}>
                                    <p>Base Score ({selectedDifficulty}): <span className={scoreDetail}>{BASE_SCORES[selectedDifficulty!]}</span></p>
                                    <p>Free Hint (First letter): <span className={scoreDetail}>0</span></p>
                                    <p>Hint Penalty ({Math.max(hintLevel - 1, 0)} hints): <span className={scoreDetail}>-{Math.max(hintLevel - 1, 0) * HINT_PENALTY}</span></p>
                                    <p>Time Bonus ({timeRemaining}s remaining): <span className={scoreDetail}>+{timeBonus}</span></p>
                                    <p>Final Score: <span className={scoreDetail}>{finalScore}</span></p>
                                </div>
                            ) : (
                                <p className={noScore}>No points earned - try again!</p>
                            )}
                        </div>
                    </div>
                )}
                <div className={gameStats}>
                    <p>Difficulty: <span className={statValue}>{selectedDifficulty}</span></p>
                    <p>Type: <span className={statValue}>{selectedType}</span></p>
                    <p>Hints used: <span className={statValue}>{hintLevel} / {currentTrivia?.hintCount || 0}</span></p>
                    <p>Total hints available: <span className={statValue}>{currentTrivia?.hintCount || 0}</span></p>
                    <p>Time solved: <span className={statValue}>{timeSolved}s</span></p>
                    <p>Time remaining: <span className={statValue}>{timeRemaining}s</span></p>
                    <p>Time bonus: <span className={statValue}>+{timeBonus} points</span></p>
                    {currentTrivia && (
                        <>
                            {selectedType === 'player' && (
                                <>
                                    <p>Player name: <span className={statValue}>{(currentTrivia as TriviaPlayer).name}</span></p>
                                    {(currentTrivia as TriviaPlayer).position && (
                                        <p>Position: <span className={statValue}>{(currentTrivia as TriviaPlayer).position}</span></p>
                                    )}
                                </>
                            )}
                            {selectedType === 'team' && (
                                <>
                                    <p>Team name: <span className={statValue}>{(currentTrivia as TriviaTeam).name}</span></p>
                                    <p>Placement: <span className={statValue}>{(currentTrivia as TriviaTeam).placement}</span></p>
                                </>
                            )}
                            {selectedType === 'season' && (
                                <p>Season number: <span className={statValue}>{(currentTrivia as TriviaSeason).seasonNumber}</span></p>
                            )}
                        </>
                    )}
                </div>
            </div>
            <div className={resultButtons}>
                <button className={playAgainBtn} onClick={resetGame}>
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
        <div className={pageShell}>
            <div className={`${triviaPage}${isLoading ? ' opacity-70 pointer-events-none' : ''}`}>
                {hasError && (
                    <div className={errorMessage}>
                        <h3>Error</h3>
                        <p>{hasError}</p>
                        <button onClick={dismissError}>Dismiss</button>
                    </div>
                )}
                
                {isLoading && gameState === 'playing' && (
                    <div className={loadingMessage}>
                        <h3>Loading trivia...</h3>
                        <p>Please wait while we fetch your trivia question.</p>
                    </div>
                )}
                
                {gameState === 'selection' && renderSelectionScreen()}
                {gameState === 'playing' && !isLoading && renderGameScreen()}
                {gameState === 'result' && renderResultScreen()}
            </div>
        </div>
    );
};

export default TriviaPage; 