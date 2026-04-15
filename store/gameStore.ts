import { create } from "zustand";
import { ALL_PLAYERS, QUESTIONS, PRIZE_LADDER } from "@/data/mockData";

export type Phase = "idle" | "spinning" | "selected" | "quiz" | "done";

export const SPIN_DURATION = 4200;
const SPIN_BUFFER = 900;

const MIN_EXTRA_SPINS = 5;
const WHEEL_SEGMENT_COUNT = 16;
const WHEEL_SEGMENTS = Array.from({ length: WHEEL_SEGMENT_COUNT }, (_, i) =>
  String(i + 1),
);

function calcTargetRotation(
  targetIndex: number,
  numPlayers: number,
  currentRotation: number,
): number {
  const segDeg = 360 / numPlayers;
  const base = (((-targetIndex * segDeg) % 360) + 360) % 360;
  const minDest = currentRotation + MIN_EXTRA_SPINS * 360;
  const k = Math.ceil((minDest - base) / 360);
  return base + k * 360;
}

// ── Serialisable game data (broadcast over BroadcastChannel) ──────────────────

export interface GameData {
  phase: Phase;

  // Players
  allPlayers: string[];
  selectedPlayers: string[];
  eliminated: string[];
  currentContestant: string | null;

  // Wheel
  wheelPlayers: string[]; // fixed decorative segments
  wheelRotation: number;
  wheelTargetRotation: number;
  spinRound: number;

  // Quiz
  currentQuestionIndex: number;
  revealAnswer: boolean;
  currentLevel: number;

  // Lifelines
  usedLifelines: string[];
  hiddenAnswers: number[];

  // End state
  gameOver: boolean;
  winner: string | null;

  // Screen visibility
  screenVisible: boolean;

  // Player's chosen answer
  playerAnswer: number | null;
}

interface GameActions {
  spinOnce: () => void;
  startQuiz: () => void;
  nextPlayer: () => void;
  correctAnswer: () => void;
  nextQuestion: () => void;
  eliminateContestant: () => void;
  revealCurrentAnswer: () => void;
  useLifeline5050: () => void;
  useLifelineSkip: () => void;
  useLifelineColleague: () => void;
  selectPlayerAnswer: (index: number) => void;
  showScreen: () => void;
  resetGame: () => void;
  syncState: (data: GameData) => void;
}

export type GameStore = GameData & GameActions;

// ── Initial state ─────────────────────────────────────────────────────────────

const initialData: GameData = {
  phase: "idle",
  allPlayers: ALL_PLAYERS,
  selectedPlayers: [],
  eliminated: [],
  currentContestant: null,

  wheelPlayers: WHEEL_SEGMENTS,
  wheelRotation: 0,
  wheelTargetRotation: 0,
  spinRound: 0,

  currentQuestionIndex: 0,
  revealAnswer: false,
  currentLevel: 0,

  usedLifelines: [],
  hiddenAnswers: [],

  gameOver: false,
  winner: null,

  screenVisible: false,

  playerAnswer: null,
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialData,

  // ── Wheel ────────────────────────────────────────────────────────────────────

  spinOnce: () => {
    const state = get();
    if (state.phase !== "idle") return;

    const n = WHEEL_SEGMENT_COUNT;
    const targetIndex = Math.floor(Math.random() * n);
    const targetRot = calcTargetRotation(targetIndex, n, state.wheelRotation);

    set({ phase: "spinning", wheelTargetRotation: targetRot });

    setTimeout(() => {
      const curr = get();

      const remaining = curr.allPlayers.filter(
        (p) => !curr.selectedPlayers.includes(p),
      );
      if (remaining.length === 0) return;
      const selectedPlayer =
        remaining[Math.floor(Math.random() * remaining.length)];

      set({
        phase: "selected",
        wheelRotation: targetRot,
        currentContestant: selectedPlayer,
        selectedPlayers: [...curr.selectedPlayers, selectedPlayer],
        spinRound: curr.spinRound + 1,
      });
    }, SPIN_DURATION + SPIN_BUFFER);
  },

  // ── selected → quiz ──────────────────────────────────────────────────────────

  startQuiz: () =>
    set({
      phase: "quiz",
      revealAnswer: false,
      usedLifelines: [],
      hiddenAnswers: [],
      gameOver: false,
      winner: null,
      playerAnswer: null,
    }),

  // ── quiz actions ─────────────────────────────────────────────────────────────

  revealCurrentAnswer: () => set({ revealAnswer: true }),

  /** Player answered correctly — advance level then go to done. */
  correctAnswer: () => {
    const { currentLevel, currentContestant } = get();
    const next = currentLevel + 1;
    if (next >= PRIZE_LADDER.length || next >= QUESTIONS.length) {
      set({ gameOver: true, winner: currentContestant, phase: "done" });
      return;
    }
    set({
      currentQuestionIndex: next,
      currentLevel: next,
      revealAnswer: false,
      hiddenAnswers: [],
      playerAnswer: null,
      phase: "done",
    });
  },

  nextQuestion: () => {
    const { currentLevel, currentContestant } = get();
    const next = currentLevel + 1;
    if (next >= PRIZE_LADDER.length || next >= QUESTIONS.length) {
      // Last question answered correctly — contestant wins
      set({ winner: currentContestant, phase: "done" });
      return;
    }
    // More questions remain — stay in quiz
    set({
      currentQuestionIndex: next,
      currentLevel: next,
      revealAnswer: false,
      hiddenAnswers: [],
      playerAnswer: null,
      phase: "quiz",
    });
  },

  eliminateContestant: () => {
    const { currentContestant, eliminated } = get();
    if (!currentContestant) return;
    set({
      eliminated: [...eliminated, currentContestant],
      winner: null,
      revealAnswer: false,
      hiddenAnswers: [],
      playerAnswer: null,
      phase: "done",
    });
  },

  // ── done → idle ──────────────────────────────────────────────────────────────

  nextPlayer: () =>
    set({
      phase: "idle",
      currentContestant: null,
      playerAnswer: null,
      revealAnswer: false,
    }),

  // ── Lifelines ────────────────────────────────────────────────────────────────

  useLifeline5050: () => {
    const { currentQuestionIndex, usedLifelines } = get();
    if (usedLifelines.includes("5050")) return;
    const question = QUESTIONS[currentQuestionIndex];
    if (!question) return;
    const wrong = ([0, 1, 2, 3] as const).filter((i) => i !== question.correct);
    const shuffled = [...wrong].sort(() => Math.random() - 0.5);
    set({
      hiddenAnswers: shuffled.slice(0, 2),
      usedLifelines: [...usedLifelines, "5050"],
    });
  },

  useLifelineSkip: () => {
    const { usedLifelines } = get();
    if (usedLifelines.includes("skip")) return;
    set({ usedLifelines: [...usedLifelines, "skip"] });
  },

  useLifelineColleague: () => {
    const { usedLifelines } = get();
    if (usedLifelines.includes("colleague")) return;
    set({ usedLifelines: [...usedLifelines, "colleague"] });
  },

  // ── Utility ──────────────────────────────────────────────────────────────────

  selectPlayerAnswer: (index) => set({ playerAnswer: index }),

  showScreen: () => set({ screenVisible: true }),

  resetGame: () => set(initialData),

  syncState: (data: GameData) => set(data),
}));
