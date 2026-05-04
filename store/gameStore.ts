import { create } from "zustand";
import { ALL_PLAYERS, PLAYERS, PlayerQuestion } from "@/data/mockData";

export type Phase = "idle" | "spinning" | "selected" | "quiz" | "intermission" | "done" | "winner";

export const SPIN_DURATION = 4000;

const WHEEL_NAMES = [
  'Lars Svensson', 'Emma Nilsson', 'Johan Eriksson', 'Maria Larsson',
  'Anders Karlsson', 'Sofia Andersson', 'Mikael Lindström', 'Klara Persson',
  'Oskar Gustafsson', 'Maja Olsson', 'Filip Johansson', 'Hanna Pettersson',
  'Gustav Magnusson', 'Lina Björk', 'Erik Holm', 'Sara Lindgren',
  'Tobias Berg', 'Astrid Nyström', 'Viktor Strand', 'Ida Forsgren',
];

export interface GameData {
  phase: Phase;
  wheelSpinning: boolean;
  wheelTargetRotation: number;
  spinRound: number;
  selectedPlayers: string[];
  currentContestant: string | null;
  eliminated: string[];
  activeQuestion: PlayerQuestion | null;
  playerAnswer: number | null;
  revealAnswer: boolean;
  aiThinking: boolean;
  aiReveal: boolean;
  aiWrongAnswer: number | null;
  hiddenAnswers: number[];
  usedLifelines: string[];
  winnerName: string | null;
  forcedWinner: string | null;
  screenVisible: boolean;
  wheelPlayers: string[];
}

interface GameActions {
  spinOnce: () => void;
  showScreen: () => void;
  setForcedWinner: (n: string | null) => void;
  setActiveQuestion: (q: PlayerQuestion) => void;
  selectPlayerAnswer: (i: number) => void;
  revealCurrentAnswer: () => void;
  markCorrect: () => void;
  markWrong: () => void;
  nextPlayer: () => void;
  readyForNextSpin: () => void;
  startQuiz: () => void;
  resetGame: () => void;
  useLifelineAI: () => void;
  use5050: () => void;
  syncState: (data: GameData) => void;
}

export type GameStore = GameData & GameActions;

const initialData: GameData = {
  phase: "idle",
  wheelSpinning: false,
  wheelTargetRotation: 0,
  spinRound: 0,
  selectedPlayers: [],
  currentContestant: null,
  eliminated: [],
  activeQuestion: null,
  playerAnswer: null,
  revealAnswer: false,
  aiThinking: false,
  aiReveal: false,
  aiWrongAnswer: null,
  hiddenAnswers: [],
  usedLifelines: [],
  winnerName: null,
  forcedWinner: null,
  screenVisible: false,
  wheelPlayers: WHEEL_NAMES,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialData,

  spinOnce: () => {
    const state = get();
    if (state.phase !== "idle") return;
    const remaining = ALL_PLAYERS.filter(
      (p) => !state.selectedPlayers.includes(p),
    );
    if (remaining.length === 0) return;
    const winner =
      state.forcedWinner && remaining.includes(state.forcedWinner)
        ? state.forcedWinner
        : remaining[Math.floor(Math.random() * remaining.length)];

    set({ wheelSpinning: true, phase: "spinning" });

    setTimeout(() => {
      const curr = get();
      set({
        wheelSpinning: false,
        currentContestant: winner,
        selectedPlayers: [...curr.selectedPlayers, winner],
        spinRound: curr.spinRound + 1,
        forcedWinner: null,
        phase: "selected",
      });
    }, SPIN_DURATION);
  },

  showScreen: () => set({ screenVisible: true }),

  setForcedWinner: (n) => set({ forcedWinner: n }),

  setActiveQuestion: (q) =>
    set({ activeQuestion: q, playerAnswer: null, revealAnswer: false, phase: "quiz", hiddenAnswers: [], aiThinking: false, aiReveal: false, aiWrongAnswer: null }),

  selectPlayerAnswer: (i) => set({ playerAnswer: i, aiThinking: false, aiReveal: false, aiWrongAnswer: null }),

  revealCurrentAnswer: () => set({ revealAnswer: true }),

  markCorrect: () => {
    const { activeQuestion, currentContestant } = get();
    if (activeQuestion?.round === 3) {
      set({ phase: "winner", winnerName: currentContestant, activeQuestion: null, playerAnswer: null, revealAnswer: false, hiddenAnswers: [], aiThinking: false, aiReveal: false, aiWrongAnswer: null });
    } else {
      set({ phase: "intermission", activeQuestion: null, playerAnswer: null, revealAnswer: false, hiddenAnswers: [], aiThinking: false, aiReveal: false, aiWrongAnswer: null });
    }
  },

  markWrong: () => {
    const { currentContestant, eliminated } = get();
    set({
      eliminated: currentContestant ? [...eliminated, currentContestant] : eliminated,
      activeQuestion: null,
      playerAnswer: null,
      revealAnswer: false,
      phase: "done",
      hiddenAnswers: [],
      usedLifelines: [],
      aiThinking: false,
      aiReveal: false,
      aiWrongAnswer: null,
    });
  },

  nextPlayer: () =>
    set({
      phase: "idle",
      currentContestant: null,
      winnerName: null,
      activeQuestion: null,
      playerAnswer: null,
      revealAnswer: false,
      hiddenAnswers: [],
      usedLifelines: [],
      aiThinking: false,
      aiReveal: false,
      aiWrongAnswer: null,
    }),

  readyForNextSpin: () => set({ phase: "idle" }),

  startQuiz: () => set((state) => ({ ...state, phase: "intermission" })),

  resetGame: () => set(initialData),

  useLifelineAI: () => {
    const state = get();
    if (state.usedLifelines.includes('ai')) return;
    const correct = state.activeQuestion?.correct ?? 0;
    const wrongOptions = [0, 1, 2, 3].filter(i => i !== correct);
    const aiWrongAnswer = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
    set({ aiThinking: true, aiReveal: false, aiWrongAnswer, usedLifelines: [...state.usedLifelines, 'ai'] });
    setTimeout(() => set({ aiThinking: false, aiReveal: true }), 4000);
  },

  use5050: () => set((state) => {
    if (!state.activeQuestion) return state;
    if (state.usedLifelines.includes('5050')) return state;

    const correct = state.activeQuestion.correct;
    const wrongIndexes = [0, 1, 2, 3].filter(i => i !== correct);
    const shuffled = wrongIndexes.sort(() => Math.random() - 0.5);
    const toHide = [shuffled[0], shuffled[1]];

    return {
      ...state,
      usedLifelines: [...state.usedLifelines, '5050'],
      hiddenAnswers: toHide,
    };
  }),

  syncState: (data) => set(data),
}));
