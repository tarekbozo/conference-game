"use client";

import { useEffect, useRef } from "react";
import { Phase } from "@/store/gameStore";

type SoundKey =
  | "spinLoop"
  | "quizLoop"
  | "correctLevel1"
  | "correctLevel2"
  | "correctLevel3"
  | "wrong"
  | "lifeline";

const audioFiles: Record<SoundKey, string> = {
  spinLoop: "/sounds/spin-loop.mp3",
  quizLoop: "/sounds/quiz-loop.mp3",
  correctLevel1: "/sounds/correct-level-1.mp3",
  correctLevel2: "/sounds/correct-level-2.mp3",
  correctLevel3: "/sounds/correct-level-3.mp3",
  wrong: "/sounds/wrong.mp3",
  lifeline: "/sounds/lifeline.mp3",
};

interface UseScreenAudioOptions {
  phase: Phase;
  screenVisible: boolean;
  revealAnswer: boolean;
  playerAnswer: number | null;
  currentQuestionCorrect: number;
  currentLevel: number;
  usedLifelines: string[];
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
}: UseScreenAudioOptions) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<Partial<Record<SoundKey, AudioBuffer>>>({});
  const bgSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const loadPromiseRef = useRef<Promise<void> | null>(null);
  const lastRevealRef = useRef<boolean>(false);
  const lastLifelineCountRef = useRef<number>(usedLifelines.length);
  const mountedRef = useRef(true);

  const ensureAudioContext = (): AudioContext => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  };

  const stopBackgroundMusic = () => {
    const source = bgSourceRef.current;
    if (!source) return;
    try {
      source.stop();
    } catch {
      // ignore if already stopped
    }
    source.disconnect();
    bgSourceRef.current = null;
  };

  const ensureAudioLoaded = async () => {
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

  const playBackgroundMusic = async (key: SoundKey) => {
    try {
      await ensureAudioLoaded();
      if (!mountedRef.current || !screenVisible) return;

      const context = ensureAudioContext();
      if (context.state === "suspended") {
        await context.resume();
      }

      const buffer = buffersRef.current[key];
      if (!buffer) return;

      stopBackgroundMusic();

      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(context.destination);
      source.start();
      bgSourceRef.current = source;
    } catch (error) {
      console.error("Unable to play background music:", error);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    loadPromiseRef.current = ensureAudioLoaded();

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
    if (!screenVisible) {
      stopBackgroundMusic();
      return;
    }

    if (phase === "spinning") {
      void playBackgroundMusic("spinLoop");
      return;
    }

    if (phase === "quiz") {
      void playBackgroundMusic("quizLoop");
      return;
    }

    stopBackgroundMusic();
  }, [phase, screenVisible]);

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
