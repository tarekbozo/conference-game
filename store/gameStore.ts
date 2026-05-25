import { create } from "zustand";
import { PLAYERS, PlayerQuestion, WHEEL_NAMES, WINNERS } from "@/data/mockData";

export type Phase =
  | "idle"
  | "spinning"
  | "selected"
  | "reveal"
  | "playersReady"
  | "nextRound"
  | "quiz"
  | "intermission"
  | "done"
  | "winner"
  | "reinventors";

export const SPIN_DURATION = 10000;       // ms — total spin animation
export const BETWEEN_SPIN_DELAY = 3000;   // ms — reveal pause before next spin
export const POST_SPIN_IDLE_DELAY = 800;  // ms — idle gap before drum resets for next spin

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
  usedLifelines: Record<string, string[]>;
  upcomingRound: number;
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
  onSpinComplete: () => void;
  showScreen: () => void;
  setActiveQuestion: (q: PlayerQuestion) => void;
  revealTrapAnswer: () => void;
  selectPlayerAnswer: (i: number) => void;
  revealCurrentAnswer: () => void;
  markCorrect: () => void;
  markWrong: () => void;
  nextPlayer: () => void;
  readyForNextSpin: () => void;
  startQuiz: () => void;
  beginRound: () => void;
  showNextRound: (round: number) => void;
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
  usedLifelines: {},
  upcomingRound: 1,
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
    // Reveal is triggered by onSpinComplete callback from SlotDrum, not a timeout here.
  },

  // Called by SlotDrum when its animation ends
  onSpinComplete: () => {
    const curr = get();
    if (!curr.wheelSpinning) return;
    const winner = curr.raffleQueue[curr.raffleIndex];
    const nextIndex = curr.raffleIndex + 1;
    const allSelected = nextIndex >= curr.raffleQueue.length;

    set({
      wheelSpinning: false,
      currentContestant: winner,
      selectedPlayers: [...curr.selectedPlayers, winner],
      spinRound: curr.spinRound + 1,
      raffleIndex: nextIndex,
      phase: "reveal",
      // Initialise this player's lifeline record
      usedLifelines: { ...curr.usedLifelines, [winner]: curr.usedLifelines[winner] ?? [] },
    });

    setTimeout(() => {
      if (allSelected) {
        set({ phase: "playersReady" });
      } else {
        set({ phase: "idle" });
        setTimeout(() => get().spinOnce(), POST_SPIN_IDLE_DELAY);
      }
    }, BETWEEN_SPIN_DELAY);
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
      phase: "quiz",
    })),

  revealTrapAnswer: () => set({ showTrapAnswer: true }),

  selectPlayerAnswer: (i) =>
    set({
      playerAnswer: i,
      aiThinking: false,
      aiReveal: false,
      aiWrongAnswer: null,
    }),

  revealCurrentAnswer: () => set({ revealAnswer: true }),

  markCorrect: () => {
    const { activeQuestion } = get();
    if (activeQuestion?.round === 3) {
      set({
        phase: "reinventors",
        reinventors: WINNERS.map((id) => PLAYERS.find((p) => p.id === id)?.name ?? "").filter(Boolean) as string[],
        activeQuestion: null,
        playerAnswer: null,
        revealAnswer: false,
        hiddenAnswers: [],
        showTrapAnswer: false,
        aiThinking: false,
        aiReveal: false,
        aiWrongAnswer: null,
      });
    } else {
      // Show next-round interstitial with the upcoming round number
      const nextRound = (activeQuestion?.round ?? 1) + 1;
      set({
        phase: "nextRound",
        upcomingRound: nextRound,
        activeQuestion: null,
        playerAnswer: null,
        revealAnswer: false,
        hiddenAnswers: [],
        showTrapAnswer: false,
        aiThinking: false,
        aiReveal: false,
        aiWrongAnswer: null,
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
      aiThinking: false,
      aiReveal: false,
      aiWrongAnswer: null,
    }),

  readyForNextSpin: () => set({ phase: "idle" }),

  // Transitions from playersReady → nextRound (round 1) before the first question
  startQuiz: () => set({ phase: "nextRound", upcomingRound: 1 }),

  // Transitions from nextRound → intermission so host can pick a question
  beginRound: () => set({ phase: "intermission" }),

  // Manually jump to any round interstitial screen
  showNextRound: (round: number) => set({ phase: "nextRound", upcomingRound: round }),

  resetGame: () => set(initialData),

  useLifelineAI: () => {
    const state = get();
    const contestant = state.currentContestant ?? "";
    const contestantLifelines = state.usedLifelines[contestant] ?? [];
    if (contestantLifelines.includes("ai")) return;

    const correct = state.activeQuestion?.correct ?? 0;
    const wrongOptions = [0, 1, 2, 3].filter((i) => i !== correct);
    const aiWrongAnswer =
      wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
    set({
      aiThinking: true,
      aiReveal: false,
      aiWrongAnswer,
      usedLifelines: {
        ...state.usedLifelines,
        [contestant]: [...contestantLifelines, "ai"],
      },
    });
    setTimeout(() => set({ aiThinking: false, aiReveal: true }), 4000);
  },

  use5050: () =>
    set((state) => {
      if (!state.activeQuestion) return state;
      const contestant = state.currentContestant ?? "";
      const contestantLifelines = state.usedLifelines[contestant] ?? [];
      if (contestantLifelines.includes("5050")) return state;

      const correct = state.activeQuestion.correct;
      const wrongIndexes = [0, 1, 2, 3].filter((i) => i !== correct);
      const shuffled = wrongIndexes.sort(() => Math.random() - 0.5);
      const toHide = [shuffled[0], shuffled[1]];

      return {
        ...state,
        usedLifelines: {
          ...state.usedLifelines,
          [contestant]: [...contestantLifelines, "5050"],
        },
        hiddenAnswers: toHide,
      };
    }),

  skipReveal: () => set({ phase: "idle" }),

  showReinventors: (name1, name2) =>
    set({ phase: "reinventors", reinventors: [name1, name2] }),

  syncState: (data) => set(data),
}));
