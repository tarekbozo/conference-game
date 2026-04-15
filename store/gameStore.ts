import { create } from "zustand";
import { ALL_PLAYERS, QUESTIONS, PRIZE_LADDER } from "@/data/mockData";

export type Phase = "wheel" | "selection" | "game";

export const SPIN_DURATION = 4200;
const SPIN_BUFFER = 900; // extra time after wheel stops before state updates

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
  selectedPlayers: string[]; // 5 players chosen by the wheel
  eliminated: string[];
  currentContestant: string | null;

  // Wheel phase
  wheelPlayers: string[]; // fixed decorative segments on the wheel
  wheelRotation: number; // resting rotation after last completed spin
  wheelTargetRotation: number; // target for the current / latest spin
  wheelSpinning: boolean; // true while CSS transition is in flight
  spinRound: number; // 0 = no spins done yet; 5 = all done

  // Quiz phase
  currentQuestionIndex: number;
  revealAnswer: boolean;
  currentLevel: number;

  // Lifelines
  usedLifelines: string[];
  hiddenAnswers: number[]; // answer indices hidden by 50:50

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
  goToSelection: () => void;
  selectContestant: (name: string) => void;
  startGame: () => void;
  revealCurrentAnswer: () => void;
  nextQuestion: () => void;
  eliminateContestant: () => void;
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
  phase: "wheel",
  allPlayers: ALL_PLAYERS,
  selectedPlayers: [],
  eliminated: [],
  currentContestant: null,

  wheelPlayers: WHEEL_SEGMENTS,
  wheelRotation: 0,
  wheelTargetRotation: 0,
  wheelSpinning: false,
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

  // ── Wheel phase ─────────────────────────────────────────────────────────────

  spinOnce: () => {
    const state = get();
    if (state.wheelSpinning) return; // already spinning
    if (state.spinRound >= 5) return; // all 5 players chosen

    // Spin to a random decorative segment (purely visual)
    const n = WHEEL_SEGMENT_COUNT;
    const targetIndex = Math.floor(Math.random() * n);
    const targetRot = calcTargetRotation(targetIndex, n, state.wheelRotation);

    set({
      wheelSpinning: true,
      wheelTargetRotation: targetRot,
    });

    // After the animation + buffer: pick a random unselected real player
    setTimeout(() => {
      const curr = get();

      const remaining = curr.allPlayers.filter(
        (p) => !curr.selectedPlayers.includes(p),
      );
      const selectedPlayer =
        remaining[Math.floor(Math.random() * remaining.length)];

      set({
        wheelSpinning: false,
        wheelRotation: targetRot, // persist resting position
        // wheelPlayers is never mutated — segments stay fixed
        selectedPlayers: [...curr.selectedPlayers, selectedPlayer],
        spinRound: curr.spinRound + 1,
      });
    }, SPIN_DURATION + SPIN_BUFFER);
  },

  goToSelection: () => set({ phase: "selection" }),

  // ── Selection phase ──────────────────────────────────────────────────────────

  selectContestant: (name) => set({ currentContestant: name }),

  startGame: () =>
    set({
      phase: "game",
      currentQuestionIndex: 0,
      currentLevel: 0,
      revealAnswer: false,
      usedLifelines: [],
      hiddenAnswers: [],
      gameOver: false,
      winner: null,
    }),

  // ── Quiz phase ───────────────────────────────────────────────────────────────

  revealCurrentAnswer: () => set({ revealAnswer: true }),

  nextQuestion: () => {
    const { currentLevel, currentContestant } = get();
    const next = currentLevel + 1;
    if (next >= PRIZE_LADDER.length || next >= QUESTIONS.length) {
      set({ gameOver: true, winner: currentContestant });
      return;
    }
    set({
      currentQuestionIndex: next,
      currentLevel: next,
      revealAnswer: false,
      hiddenAnswers: [],
      playerAnswer: null,
    });
  },

  eliminateContestant: () => {
    const { currentContestant, eliminated } = get();
    if (!currentContestant) return;
    set({
      eliminated: [...eliminated, currentContestant],
      currentContestant: null,
      revealAnswer: false,
      hiddenAnswers: [],
      playerAnswer: null,
      phase: "selection",
    });
  },

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

  // Skip and Ask-Colleague are UI-only for MVP: just mark as used
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

  /** Called by BroadcastChannel on the screen tab to hydrate state. */
  syncState: (data: GameData) => set(data),
}));
