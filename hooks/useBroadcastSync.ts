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
        // Only serialise the data fields — functions cannot travel over BroadcastChannel
        const payload: GameData = {
          phase: state.phase,
          allPlayers: state.allPlayers,
          selectedPlayers: state.selectedPlayers,
          eliminated: state.eliminated,
          currentContestant: state.currentContestant,
          wheelPlayers: state.wheelPlayers,
          wheelRotation: state.wheelRotation,
          wheelTargetRotation: state.wheelTargetRotation,
          wheelSpinning: state.wheelSpinning,
          spinRound: state.spinRound,
          currentQuestionIndex: state.currentQuestionIndex,
          revealAnswer: state.revealAnswer,
          currentLevel: state.currentLevel,
          usedLifelines: state.usedLifelines,
          hiddenAnswers: state.hiddenAnswers,
          gameOver: state.gameOver,
          winner: state.winner,
          screenVisible: state.screenVisible,
          playerAnswer: state.playerAnswer,
        };
        channel.postMessage({ type: "SYNC", state: payload });
      });

      return () => {
        unsubscribe();
        channel.close();
      };
    } else {
      // Screen: receive and apply state
      channel.onmessage = (event: MessageEvent) => {
        if (event.data?.type === "SYNC") {
          useGameStore.getState().syncState(event.data.state as GameData);
        }
      };

      return () => channel.close();
    }
  }, [role]);
}
