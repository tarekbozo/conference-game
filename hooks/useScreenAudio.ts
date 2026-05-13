"use client";

import { useEffect, useRef } from "react";
import { Phase } from "@/store/gameStore";

type SoundKey =
  | "spinLoop"
  | "quizLoop"
  | "gameStart"
  | "correctLevel1"
  | "correctLevel2"
  | "correctLevel3"
  | "wrong"
  | "eliminated"
  | "lifeline"
  | "playerRevealed";

const audioFiles: Record<SoundKey, string> = {
  spinLoop: "/sounds/spin-loop.mp3",
  quizLoop: "/sounds/quiz-loop.mp3",
  gameStart: "/sounds/game-start.mp3",
  correctLevel1: "/sounds/correct-level-1.mp3",
  correctLevel2: "/sounds/correct-level-2.mp3",
  correctLevel3: "/sounds/correct-level-3.mp3",
  wrong: "/sounds/wrong.mp3",
  eliminated: "/sounds/eliminated.mp3",
  lifeline: "/sounds/lifeline.mp3",
  playerRevealed: "/sounds/player-revealed.mp3",
};

interface UseScreenAudioOptions {
  phase: Phase;
  screenVisible: boolean;
  revealAnswer: boolean;
  playerAnswer: number | null;
  currentQuestionCorrect: number;
  currentLevel: number;
  usedLifelines: string[];
  audioEnabled: boolean;
}

async function fetchAudioBuffer(
  context: AudioContext,
  url: string,
): Promise<AudioBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load audio asset: ${url}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return await context.decodeAudioData(arrayBuffer);
}

export function useScreenAudio({
  phase,
  screenVisible,
  revealAnswer,
  playerAnswer,
  currentQuestionCorrect,
  currentLevel,
  usedLifelines,
  audioEnabled,
}: UseScreenAudioOptions) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<Partial<Record<SoundKey, AudioBuffer>>>({});
  const bgSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bgGainRef = useRef<GainNode | null>(null);
  const currentBgKeyRef = useRef<SoundKey | null>(null);
  const fadeTimeoutRef = useRef<number | null>(null);
  const loadPromiseRef = useRef<Promise<void> | null>(null);
  const lastRevealRef = useRef<boolean>(false);
  const lastLifelineCountRef = useRef<number>(usedLifelines.length);
  const lastPhaseRef = useRef<Phase>(phase);
  const startPlayedRef = useRef(false);
  const mountedRef = useRef(true);

  const ensureAudioContext = (): AudioContext => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  };

  const cancelBackgroundFade = () => {
    if (fadeTimeoutRef.current !== null) {
      window.clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
  };

  const stopBackgroundMusic = () => {
    cancelBackgroundFade();

    const source = bgSourceRef.current;
    if (!source) return;
    try {
      source.stop();
    } catch {
      // ignore if already stopped
    }
    source.disconnect();
    bgSourceRef.current = null;
    currentBgKeyRef.current = null;
  };

  const fadeOutBackgroundMusic = (duration = 0.5) => {
    const context = audioContextRef.current;
    const gain = bgGainRef.current;
    if (!context || !gain || !bgSourceRef.current) {
      stopBackgroundMusic();
      return;
    }

    cancelBackgroundFade();
    const now = context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    fadeTimeoutRef.current = window.setTimeout(() => {
      stopBackgroundMusic();
    }, duration * 1000);
  };

  const ensureAudioLoaded = async () => {
    if (!audioEnabled) return;
    if (!loadPromiseRef.current) {
      loadPromiseRef.current = (async () => {
        const context = ensureAudioContext();
        const entries = Object.entries(audioFiles) as Array<[
          SoundKey,
          string,
        ]>;

        await Promise.all(
          entries.map(async ([key, url]) => {
            const buffer = await fetchAudioBuffer(context, url);
            buffersRef.current[key] = buffer;
          }),
        );
      })();
    }

    return loadPromiseRef.current;
  };

  const playEffect = async (key: SoundKey) => {
    if (!audioEnabled) return;
    try {
      await ensureAudioLoaded();
      if (!mountedRef.current) return;

      const context = ensureAudioContext();
      if (context.state === "suspended") {
        await context.resume();
      }

      const buffer = buffersRef.current[key];
      if (!buffer) return;

      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start();
    } catch (error) {
      console.error("Unable to play sound effect:", error);
    }
  };

  const playBackgroundMusic = async (key: SoundKey, volume: number) => {
    if (!audioEnabled) return;
    try {
      await ensureAudioLoaded();
      if (!mountedRef.current || !screenVisible) return;

      const context = ensureAudioContext();
      if (context.state === "suspended") {
        await context.resume();
      }

      const buffer = buffersRef.current[key];
      if (!buffer) return;

      const existingKey = currentBgKeyRef.current;
      const gain = bgGainRef.current ?? context.createGain();
      gain.connect(context.destination);
      bgGainRef.current = gain;

      if (existingKey === key && bgSourceRef.current) {
        cancelBackgroundFade();
        const now = context.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(volume, now + 1);
        currentBgKeyRef.current = key;
        return;
      }

      stopBackgroundMusic();

      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain);
      gain.gain.setValueAtTime(volume, context.currentTime);
      source.start();
      bgSourceRef.current = source;
      currentBgKeyRef.current = key;
    } catch (error) {
      console.error("Unable to play background music:", error);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      stopBackgroundMusic();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {
          /* ignore close failures */
        });
      }
      audioContextRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!audioEnabled) {
      stopBackgroundMusic();
      return;
    }

    if (!screenVisible) {
      stopBackgroundMusic();
      return;
    }

    if (phase === "idle" || phase === "reveal") {
      void playBackgroundMusic("spinLoop", 0.25);
    } else if (phase === "spinning") {
      void playBackgroundMusic("spinLoop", 1);
    } else if (phase === "quiz") {
      void playBackgroundMusic("quizLoop", 1);
    } else {
      fadeOutBackgroundMusic(0.5);
    }

    if (phase === "selected" && !startPlayedRef.current) {
      void playEffect("gameStart");
      startPlayedRef.current = true;
    }

    if (phase !== "selected") {
      startPlayedRef.current = false;
    }

    if (phase === "done" && lastPhaseRef.current !== "done") {
      void playEffect("eliminated");
    }

    if (phase === "reveal" && lastPhaseRef.current !== "reveal") {
      void playEffect("playerRevealed");
    }

    lastPhaseRef.current = phase;
  }, [phase, screenVisible, audioEnabled]);

  useEffect(() => {
    if (revealAnswer && !lastRevealRef.current && playerAnswer !== null) {
      if (playerAnswer === currentQuestionCorrect) {
        const correctKey:
          | "correctLevel1"
          | "correctLevel2"
          | "correctLevel3" =
          currentLevel === 0
            ? "correctLevel1"
            : currentLevel === 1
            ? "correctLevel2"
            : "correctLevel3";
        void playEffect(correctKey);
      } else {
        void playEffect("wrong");
      }
    }
    lastRevealRef.current = revealAnswer;
  }, [revealAnswer, playerAnswer, currentQuestionCorrect, currentLevel]);

  useEffect(() => {
    if (usedLifelines.length > lastLifelineCountRef.current) {
      void playEffect("lifeline");
    }
    lastLifelineCountRef.current = usedLifelines.length;
  }, [usedLifelines]);
}
