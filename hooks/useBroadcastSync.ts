"use client";

import { useEffect } from "react";
import { useGameStore, GameData } from "@/store/gameStore";

const CHANNEL_NAME = "conference-game-v1";

export function useBroadcastSync(role: "admin" | "screen") {
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window))
      return;

    const channel = new BroadcastChannel(CHANNEL_NAME);

    if (role === "admin") {
      const unsubscribe = useGameStore.subscribe((state) => {
        const payload: GameData = {
          phase: state.phase,
          wheelSpinning: state.wheelSpinning,
          wheelTargetRotation: state.wheelTargetRotation,
          spinRound: state.spinRound,
          selectedPlayers: state.selectedPlayers,
          currentContestant: state.currentContestant,
          eliminated: state.eliminated,
          activeQuestion: state.activeQuestion,
          playerAnswer: state.playerAnswer,
          revealAnswer: state.revealAnswer,
          aiThinking: state.aiThinking,
          aiReveal: state.aiReveal,
          aiWrongAnswer: state.aiWrongAnswer,
          hiddenAnswers: state.hiddenAnswers,
          showTrapAnswer: state.showTrapAnswer,
          timerActive: state.timerActive,
          timerSeconds: state.timerSeconds,
          usedLifelines: state.usedLifelines,
          winnerName: state.winnerName,
          forcedWinner: null,
          screenVisible: state.screenVisible,
          wheelPlayers: state.wheelPlayers,
          wheelWinnerIndex: state.wheelWinnerIndex,
        };
        channel.postMessage({ type: "SYNC", state: payload });
      });

      return () => {
        unsubscribe();
        channel.close();
      };
    } else {
      channel.onmessage = (event: MessageEvent) => {
        if (event.data?.type === "SYNC") {
          useGameStore.getState().syncState(event.data.state as GameData);
        }
      };

      return () => channel.close();
    }
  }, [role]);
}
