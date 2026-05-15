import { create } from "zustand";
import { PLAYERS, PlayerQuestion } from "@/data/mockData";

export type Phase =
  | "idle"
  | "spinning"
  | "selected"
  | "reveal"
  | "quiz"
  | "intermission"
  | "done"
  | "winner"
  | "reinventors";

export const SPIN_DURATION = 10000;
const WHEEL_NAMES = [
  "Lars Svensson",
  "Emma Nilsson",
  "Johan Eriksson",
  "Maria Larsson",
  "Anders Karlsson",
  "Sofia Andersson",
  "Mikael Lindström",
  "Klara Persson",
  "Oskar Gustafsson",
  "Maja Olsson",
  "Filip Johansson",
  "Hanna Pettersson",
  "Gustav Magnusson",
  "Lina Björk",
  "Erik Holm",
  "Sara Lindgren",
  "Tobias Berg",
  "Astrid Nyström",
  "Viktor Strand",
  "Ida Forsgren",
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
  showTrapAnswer: boolean;
  timerActive: boolean;
  timerSeconds: number;
  usedLifelines: string[];
  winnerName: string | null;
  reinventors: string[];
  raffleQueue: string[];
  raffleIndex: number;
  screenVisible: boolean;
  wheelPlayers: string[];
  wheelWinnerIndex: number;
}

interface GameActions {
  spinOnce: () => void;
  showScreen: () => void;
  setActiveQuestion: (q: PlayerQuestion) => void;
  revealTrapAnswer: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;
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
  skipReveal: () => void;
  showReinventors: (name1: string, name2: string) => void;
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
  showTrapAnswer: false,
  timerActive: false,
  timerSeconds: 30,
  usedLifelines: [],
  winnerName: null,
  reinventors: [],
  raffleQueue: PLAYERS.map((p) => p.name),
  raffleIndex: 0,
  screenVisible: false,
  wheelPlayers: WHEEL_NAMES,
  wheelWinnerIndex: 0,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialData,

  spinOnce: () => {
    const state = get();
    if (state.wheelSpinning) return;
    const { raffleQueue, raffleIndex } = state;
    if (raffleIndex >= raffleQueue.length) return;

    const winner = raffleQueue[raffleIndex];
    const wheelNames = [...WHEEL_NAMES];
    let wheelWinnerIndex = wheelNames.indexOf(winner);
    if (wheelWinnerIndex === -1) {
      wheelNames[0] = winner;
      wheelWinnerIndex = 0;
    }

    set({
      wheelSpinning: true,
      phase: "spinning",
      wheelPlayers: wheelNames,
      wheelWinnerIndex,
    });

    setTimeout(() => {
      const curr = get();
      const nextIndex = curr.raffleIndex + 1;
      set({
        wheelSpinning: false,
        currentContestant: winner,
        selectedPlayers: [...curr.selectedPlayers, winner],
        spinRound: curr.spinRound + 1,
        raffleIndex: nextIndex,
        phase: "reveal",
      });
      setTimeout(() => {
        const updated = get();
        if (updated.raffleIndex < updated.raffleQueue.length) {
          set({ phase: "idle" });
          setTimeout(() => get().spinOnce(), 800);
        } else {
          set({ phase: "idle" });
        }
      }, 3000);
    }, SPIN_DURATION);
  },

  showScreen: () => set({ screenVisible: true }),

  setActiveQuestion: (q: PlayerQuestion) =>
    set((state) => ({
      ...state,
      activeQuestion: q,
      currentContestant: q.playerName,
      playerAnswer: null,
      revealAnswer: false,
      aiThinking: false,
      aiReveal: false,
      aiWrongAnswer: null,
      hiddenAnswers: [],
      showTrapAnswer: false,
      timerActive: true,
      timerSeconds: 30,
      phase: "quiz",
    })),

  revealTrapAnswer: () => set({ showTrapAnswer: true }),

  startTimer: () => set({ timerActive: true, timerSeconds: 30 }),
  stopTimer: () => set({ timerActive: false }),
  resetTimer: () => set({ timerActive: false, timerSeconds: 30 }),
  tickTimer: () => {
    const { timerSeconds } = get();
    const next = Math.max(0, timerSeconds - 1);
    set({ timerSeconds: next, ...(next === 0 ? { timerActive: false } : {}) });
  },

  selectPlayerAnswer: (i) =>
    set({
      playerAnswer: i,
      timerActive: false,
      aiThinking: false,
      aiReveal: false,
      aiWrongAnswer: null,
    }),

  revealCurrentAnswer: () => set({ revealAnswer: true }),

  markCorrect: () => {
    const { activeQuestion, selectedPlayers, eliminated } = get();
    if (activeQuestion?.round === 3) {
      set({
        phase: "reinventors",
        reinventors: selectedPlayers.filter((p) => !eliminated.includes(p)),
        activeQuestion: null,
        playerAnswer: null,
        revealAnswer: false,
        hiddenAnswers: [],
        showTrapAnswer: false,
        timerActive: false,
        timerSeconds: 30,
        aiThinking: false,
        aiReveal: false,
        aiWrongAnswer: null,
        usedLifelines: [],
      });
    } else {
      set({
        phase: "intermission",
        activeQuestion: null,
        playerAnswer: null,
        revealAnswer: false,
        hiddenAnswers: [],
        showTrapAnswer: false,
        timerActive: false,
        timerSeconds: 30,
        aiThinking: false,
        aiReveal: false,
        aiWrongAnswer: null,
        usedLifelines: [],
      });
    }
  },

  markWrong: () => {
    const { currentContestant, eliminated } = get();
    set({
      eliminated: currentContestant
        ? [...eliminated, currentContestant]
        : eliminated,
      activeQuestion: null,
      playerAnswer: null,
      revealAnswer: false,
      phase: "done",
      hiddenAnswers: [],
      showTrapAnswer: false,
      timerActive: false,
      timerSeconds: 30,
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
      reinventors: [],
      activeQuestion: null,
      playerAnswer: null,
      revealAnswer: false,
      hiddenAnswers: [],
      showTrapAnswer: false,
      timerActive: false,
      timerSeconds: 30,
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
    if (state.usedLifelines.includes("ai")) return;
    const correct = state.activeQuestion?.correct ?? 0;
    const wrongOptions = [0, 1, 2, 3].filter((i) => i !== correct);
    const aiWrongAnswer =
      wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
    set({
      aiThinking: true,
      aiReveal: false,
      aiWrongAnswer,
      usedLifelines: [...state.usedLifelines, "ai"],
    });
    setTimeout(() => set({ aiThinking: false, aiReveal: true }), 4000);
  },

  use5050: () =>
    set((state) => {
      if (!state.activeQuestion) return state;
      if (state.usedLifelines.includes("5050")) return state;

      const correct = state.activeQuestion.correct;
      const wrongIndexes = [0, 1, 2, 3].filter((i) => i !== correct);
      const shuffled = wrongIndexes.sort(() => Math.random() - 0.5);
      const toHide = [shuffled[0], shuffled[1]];

      return {
        ...state,
        usedLifelines: [...state.usedLifelines, "5050"],
        hiddenAnswers: toHide,
      };
    }),

  skipReveal: () => set({ phase: "idle" }),

  showReinventors: (name1, name2) =>
    set({ phase: "reinventors", reinventors: [name1, name2] }),

  syncState: (data) => set(data),
}));
