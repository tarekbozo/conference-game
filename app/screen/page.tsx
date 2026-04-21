"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { useBroadcastSync } from "@/hooks/useBroadcastSync";
import {
  QUESTIONS,
  PRIZE_LADDER,
  SAFE_LEVELS,
  Question,
} from "@/data/mockData";
import { SPIN_DURATION } from "@/store/gameStore";
import SpinningWheel from "@/components/SpinningWheel";

const LABELS = ["A", "B", "C", "D"];

// ── Waiting / idle ─────────────────────────────────────────────────────────────

function WaitingScreen() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-black">
      {/* Accenture logo */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
          paddingTop: "4vh",
        }}
      >
        <span
          style={{
            color: "#A100FF",
            fontWeight: 700,
            fontSize: "1.8vw",
            lineHeight: 1,
            marginBottom: "-18px",
            marginLeft: "118px",
          }}
        >
          &gt;
        </span>
        <span
          style={{
            color: "white",
            fontWeight: 700,
            fontSize: "2.5vw",
            letterSpacing: "0.02em",
            fontFamily: "sans-serif",
            lineHeight: 1,
          }}
        >
          accenture
        </span>
      </div>

      {/* Main content — vertically centered in remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center gap-[2.5vh]">
        <p
          className="font-black text-white uppercase tracking-[0.12em] leading-none"
          style={{ fontSize: "4vw" }}
        >
          WHO WANTS TO BE A
        </p>

        {/* REIN>ENTOR? with purple ">" */}
        <p
          className="font-black uppercase leading-none tracking-[0.06em]"
          style={{ fontSize: "10vw" }}
        >
          <span style={{ color: "white" }}>REIN</span>
          <span style={{ color: "#A100FF" }}>&gt;</span>
          <span style={{ color: "white" }}>ENTOR?</span>
        </p>

        <p
          className="text-[#666666] animate-pulse tracking-widest"
          style={{ fontSize: "1.6vw", marginTop: "2vh" }}
        >
          Waiting for host…
        </p>
      </div>
    </div>
  );
}

// ── Slot machine ──────────────────────────────────────────────────────────────

const ITEM_H = 72; // px — height of one slot row
const VISIBLE = 5; // odd number: 1 centre + 2 above + 2 below

function SlotMachine({
  names,
  spinning,
  finalName,
}: {
  names: string[];
  spinning: boolean;
  finalName: string | null;
}) {
  const [strip, setStrip] = useState<number[]>(() =>
    Array.from({ length: VISIBLE }, (_, i) => i % names.length),
  );
  const [offset, setOffset] = useState(0);
  const [bouncing, setBouncing] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const offsetRef = useRef(0);

  const nextRandom = (centre: number) => {
    let idx: number;
    do {
      idx = Math.floor(Math.random() * names.length);
    } while (names.length > 1 && idx === centre);
    return idx;
  };

  const advance = (currentStrip: number[], randomPick?: number): number[] => {
    const newCentre = randomPick ?? nextRandom(currentStrip[2]);
    const next = [...currentStrip.slice(1), newCentre];
    return next;
  };

  const EASE_WINDOW = 1200;
  const easeSteps: Array<{ delay: number; interval: number }> = [
    { delay: 0, interval: 150 },
    { delay: 600, interval: 250 },
    { delay: 900, interval: 400 },
    { delay: 1050, interval: 600 },
  ];

  const clearAll = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const startInterval = (
    ms: number,
    currentStrip: React.MutableRefObject<number[]>,
  ) => {
    clearAll();
    intervalRef.current = setInterval(() => {
      const next = advance(currentStrip.current);
      currentStrip.current = next;
      setStrip([...next]);
      offsetRef.current = 0;
      setOffset(0);
    }, ms);
  };

  useEffect(() => {
    const stripRef = { current: strip };

    if (spinning) {
      setBouncing(false);

      startInterval(150, stripRef);

      const spinEndsIn = SPIN_DURATION;
      easeSteps.forEach(({ delay, interval }) => {
        const t = setTimeout(
          () => {
            startInterval(interval, stripRef);
          },
          spinEndsIn - EASE_WINDOW + delay,
        );
        timeoutsRef.current.push(t);
      });

      const stopT = setTimeout(() => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }, spinEndsIn);
      timeoutsRef.current.push(stopT);
    } else {
      clearAll();

      if (finalName) {
        const finalIdx = names.indexOf(finalName);
        const centre = finalIdx >= 0 ? finalIdx : 0;
        const snapped = [
          (centre - 2 + names.length) % names.length,
          (centre - 1 + names.length) % names.length,
          centre,
          (centre + 1) % names.length,
          (centre + 2) % names.length,
        ];
        setStrip(snapped);
        setOffset(0);
        setBouncing(true);
        timeoutsRef.current.push(setTimeout(() => setBouncing(false), 700));
      }
    }

    return clearAll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, finalName]);

  const windowH = ITEM_H;
  const totalH = VISIBLE * ITEM_H;
  const translateY = -((VISIBLE - 1) / 2) * ITEM_H + offset;

  return (
    <div
      style={{ height: windowH }}
      className="relative rounded-xl border-2 border-[#A100FF] bg-black overflow-hidden shadow-[0_0_28px_rgba(161,0,255,0.35)]"
    >
      {/* scrolling strip */}
      <div
        style={{
          transform: `translateY(${translateY}px)`,
          height: totalH,
          transition: "none",
        }}
      >
        {strip.map((nameIdx, i) => {
          const isCentre = i === Math.floor(VISIBLE / 2);
          const name = !spinning && !finalName ? "?" : (names[nameIdx] ?? "?");
          return (
            <div
              key={i}
              style={{ height: ITEM_H }}
              className="flex items-center justify-center"
            >
              <span
                className={`block max-w-full overflow-hidden text-ellipsis whitespace-nowrap px-4 font-extrabold tracking-wide select-none transition-transform duration-150 ${
                  isCentre
                    ? bouncing
                      ? "scale-110 text-4xl text-[#A100FF]"
                      : "scale-100 text-4xl text-[#A100FF]"
                    : "scale-90 text-3xl text-[#333333]"
                }`}
              >
                {name}
              </span>
            </div>
          );
        })}
      </div>

      {/* top fade */}
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{
          height: windowH * 0.45,
          background: "linear-gradient(to bottom, #000000, transparent)",
        }}
      />
      {/* bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: windowH * 0.45,
          background: "linear-gradient(to top, #000000, transparent)",
        }}
      />

      {/* centre line indicators */}
      <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none flex flex-col justify-between py-[1px]">
        <div className="h-px bg-[#A100FF]/30" />
        <div className="h-px bg-[#A100FF]/30" />
      </div>
    </div>
  );
}

// ── Wheel screen (idle + spinning) ─────────────────────────────────────────────

function WheelPhaseScreen() {
  const {
    phase,
    allPlayers,
    currentContestant,
    wheelPlayers,
    wheelTargetRotation,
    wheelRotation,
    spinRound,
    selectedPlayers,
    eliminated,
  } = useGameStore();

  const [wheelSize, setWheelSize] = useState(600);
  useEffect(() => {
    const calc = () =>
      setWheelSize(Math.min(window.innerWidth, window.innerHeight) * 0.68);
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const spinning = phase === "spinning";
  const targetRotation = spinning ? wheelTargetRotation : wheelRotation;

  return (
    <div style={{ position: "fixed", inset: 0 }} className="bg-black">
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: "2.5vh",
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <p className="text-[3vw] font-extrabold text-[#A100FF] tracking-widest uppercase">
          🎡 Who's Playing Tonight?
        </p>
      </div>

      {/* Wheel centered */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          gap: "2vh",
        }}
        className="flex flex-col items-center"
      >
        <SlotMachine
          names={allPlayers}
          spinning={spinning}
          finalName={spinning ? null : currentContestant}
        />
        <SpinningWheel
          players={wheelPlayers}
          targetRotation={targetRotation}
          spinning={spinning}
          spinDuration={SPIN_DURATION}
          size={wheelSize}
        />
        <p
          style={{ fontSize: "1.2vw" }}
          className="text-[#666666] tracking-widest"
        >
          Round <span className="text-white font-bold">{spinRound + 1}</span>
        </p>
      </div>

      {/* Selected list — right side */}
      {selectedPlayers.length > 0 && (
        <div
          style={{
            position: "absolute",
            right: "3vw",
            top: "50%",
            transform: "translateY(-50%)",
            minWidth: "20vw",
          }}
          className="flex flex-col gap-[1.2vh]"
        >
          <p
            style={{ fontSize: "1vw" }}
            className="text-[#666666] uppercase tracking-[0.2em] mb-1"
          >
            Selected
          </p>
          {selectedPlayers.map((player, i) => {
            const isElim = eliminated.includes(player);
            return (
              <div
                key={player}
                style={{
                  paddingLeft: "2vw",
                  paddingRight: "2vw",
                  paddingTop: "1vh",
                  paddingBottom: "1vh",
                  gap: "1vw",
                }}
                className={`flex items-center border-2 rounded-full transition-all ${
                  isElim
                    ? "bg-[#1A1A1A] border-[#333333] opacity-40"
                    : "bg-[#1A1A1A] border-[#A100FF]"
                }`}
              >
                <span
                  style={{ fontSize: "1.8vw" }}
                  className="font-bold text-[#A100FF] w-[2vw]"
                >
                  {i + 1}.
                </span>
                <span
                  style={{ fontSize: "1.8vw" }}
                  className={`font-bold text-white ${isElim ? "line-through" : ""}`}
                >
                  {player}
                </span>
                {isElim && <span className="ml-auto">❌</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Selected screen ────────────────────────────────────────────────────────────

function SelectedScreen({ contestant }: { contestant: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <div className="text-center space-y-6 px-12">
        <p className="text-3xl font-bold text-[#A100FF] tracking-[0.2em] uppercase animate-pulse">
          Next Contestant
        </p>
        <p
          className="font-extrabold text-white tracking-wide leading-none break-words"
          style={{ fontSize: "clamp(2.5rem, 10vw, 7rem)" }}
        >
          {contestant}
        </p>
      </div>
    </div>
  );
}

// ── Prize ladder ───────────────────────────────────────────────────────────────

function PrizeLadder({ currentLevel }: { currentLevel: number }) {
  const reversed = [...PRIZE_LADDER].reverse();
  const lastIndex = PRIZE_LADDER.length - 1;

  return (
    <div className="flex flex-col gap-[3px] w-52 shrink-0 self-start pt-1">
      {reversed.map((prize, ri) => {
        const idx = lastIndex - ri;
        const isCurrent = idx === currentLevel;
        const isAbove = idx > currentLevel;
        const isSafe = SAFE_LEVELS.has(idx);

        return (
          <div
            key={idx}
            className={`flex items-center justify-between px-3 py-[5px] rounded-lg text-xs font-bold transition-all duration-300 ${
              isCurrent
                ? "bg-[#A100FF] text-white shadow-[0_0_18px_rgba(161,0,255,0.6)] scale-[1.06] text-sm py-2"
                : isSafe && !isAbove
                  ? "bg-[#1A0030] border border-[#A100FF]/50 text-[#A100FF]"
                  : isAbove
                    ? "bg-transparent text-[#333333]"
                    : "bg-[#1A1A1A] border border-[#333333] text-white"
            }`}
          >
            <span className="opacity-50 w-5 text-right tabular-nums">
              {idx + 1}
            </span>
            <span className="flex-1 text-right tabular-nums">
              {prize.toLocaleString()}
            </span>
            {isSafe && !isCurrent && !isAbove && (
              <span className="ml-1.5 text-[10px]">🔒</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Answer button ──────────────────────────────────────────────────────────────

function AnswerButton({
  label,
  text,
  isCorrect,
  isRevealed,
  isHidden,
  isPlayerAnswer,
}: {
  label: string;
  text: string;
  isCorrect: boolean;
  isRevealed: boolean;
  isHidden: boolean;
  isPlayerAnswer: boolean;
}) {
  if (isHidden) return <div />;

  const base =
    "flex items-center gap-5 w-full px-7 py-4 rounded-full border-2 transition-all duration-500 min-h-[68px]";

  let look: string;
  if (isRevealed) {
    if (isCorrect) {
      look = `${base} bg-green-600 border-green-300 shadow-[0_0_26px_rgba(34,197,94,0.5)]`;
    } else if (isPlayerAnswer) {
      look = `${base} bg-red-700 border-red-400 shadow-[0_0_26px_rgba(239,68,68,0.5)]`;
    } else {
      look = `${base} bg-[#1A1A1A] border-[#333333] opacity-20`;
    }
  } else {
    look = isPlayerAnswer
      ? `${base} bg-[#A100FF] border-[#A100FF] shadow-[0_0_26px_rgba(161,0,255,0.5)]`
      : `${base} bg-[#1A1A1A] border-[#333333]`;
  }

  return (
    <div className={look}>
      <span className="text-xl font-extrabold text-[#A100FF] w-7 shrink-0">
        {label}
      </span>
      <span className="text-lg font-semibold text-white leading-snug">
        {text}
      </span>
    </div>
  );
}

// ── AI Colleague overlay ───────────────────────────────────────────────────────

const THINKING_STRINGS = [
  "Scanning knowledge base...",
  "Cross-referencing sources...",
  "Calculating probability...",
  "Analyzing answer patterns...",
];

function AIColleagueOverlay({
  aiThinking,
  aiReveal,
  question,
}: {
  aiThinking: boolean;
  aiReveal: boolean;
  question: Question | undefined;
}) {
  const [thinkingText, setThinkingText] = useState(THINKING_STRINGS[0]);
  const [dotPhase, setDotPhase] = useState(0);

  useEffect(() => {
    if (!aiThinking) return;
    let idx = 0;
    const textTimer = setInterval(() => {
      idx = (idx + 1) % THINKING_STRINGS.length;
      setThinkingText(THINKING_STRINGS[idx]);
    }, 800);
    const dotTimer = setInterval(() => {
      setDotPhase((p) => (p + 1) % 4);
    }, 350);
    return () => {
      clearInterval(textTimer);
      clearInterval(dotTimer);
    };
  }, [aiThinking]);

  if (!aiThinking && !aiReveal) return null;

  const correctIdx = question?.correct ?? 0;
  const correctLabel = LABELS[correctIdx];
  const correctText = question?.answers[correctIdx] ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className={`relative rounded-3xl px-12 py-10 max-w-lg w-full mx-6 text-center shadow-2xl transition-all ${
          aiThinking
            ? "bg-black border-2 border-[#A100FF] shadow-[0_0_60px_rgba(161,0,255,0.3)]"
            : "bg-[#071a0f] border-2 border-green-500 shadow-[0_0_60px_rgba(34,197,94,0.3)]"
        }`}
        style={
          aiThinking
            ? { animation: "aiPulse 1.8s ease-in-out infinite" }
            : undefined
        }
      >
        <style>{`
          @keyframes aiPulse {
            0%, 100% { box-shadow: 0 0 40px rgba(161,0,255,0.25); }
            50% { box-shadow: 0 0 80px rgba(161,0,255,0.55); }
          }
        `}</style>

        <p className="text-2xl font-extrabold text-[#A100FF] tracking-widest uppercase mb-6">
          🤖 AI Colleague
        </p>

        {aiThinking && (
          <>
            <div className="flex justify-center gap-3 mb-6">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block w-4 h-4 rounded-full bg-[#A100FF]"
                  style={{
                    opacity: dotPhase === i || dotPhase === 3 ? 1 : 0.2,
                    transform:
                      dotPhase === i ? "translateY(-6px)" : "translateY(0)",
                    transition: "all 0.25s ease",
                  }}
                />
              ))}
            </div>
            <p className="text-lg text-white tracking-wide min-h-[28px] transition-all duration-300">
              {thinkingText}
            </p>
          </>
        )}

        {aiReveal && (
          <>
            <p className="text-lg text-gray-300 mb-6">
              I am <span className="text-[#A100FF] font-bold">99.9%</span>{" "}
              confident the answer is:
            </p>
            <div
              className="inline-flex items-center gap-4 px-8 py-5 rounded-2xl border-2 border-green-400 bg-green-900/40"
              style={{
                boxShadow:
                  "0 0 40px rgba(34,197,94,0.4), 0 0 80px rgba(34,197,94,0.15)",
              }}
            >
              <span className="text-4xl font-extrabold text-[#A100FF]">
                {correctLabel}
              </span>
              <span className="text-3xl font-bold text-green-300 leading-snug">
                {correctText}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Game screen (quiz phase) ───────────────────────────────────────────────────

function GameScreen({
  question,
  revealAnswer,
  currentLevel,
  currentContestant,
  usedLifelines,
  hiddenAnswers,
  playerAnswer,
  aiThinking,
  aiReveal,
}: {
  question: Question;
  revealAnswer: boolean;
  currentLevel: number;
  currentContestant: string | null;
  usedLifelines: string[];
  hiddenAnswers: number[];
  playerAnswer: number | null;
  aiThinking: boolean;
  aiReveal: boolean;
}) {
  const lifelines = [
    { id: "5050", label: "50:50", emoji: "✂️" },
    { id: "skip", label: "Skip", emoji: "⏭" },
    { id: "ai", label: "AI Colleague", emoji: "🤖" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <header className="flex items-center justify-between px-10 py-5 border-b border-[#333333]">
        <div className="flex gap-3">
          {lifelines.map(({ id, label, emoji }) => (
            <div
              key={id}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border-2 font-bold text-base tracking-wide transition-all ${
                usedLifelines.includes(id)
                  ? "bg-transparent border-[#333333] text-[#333333] line-through opacity-40"
                  : "bg-[#1A1A1A] border-[#A100FF] text-[#A100FF]"
              }`}
            >
              <span className="text-lg">{emoji}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="text-right">
          <p className="text-xs text-[#666666] uppercase tracking-[0.2em]">
            Contestant
          </p>
          <p className="text-3xl font-extrabold text-[#A100FF] tracking-wide">
            {currentContestant}
          </p>
        </div>
      </header>

      <main className="flex flex-1 gap-6 px-10 py-6">
        <div className="flex-1 flex flex-col justify-center gap-10">
          <div className="text-center space-y-3 px-4">
            <p className="text-sm text-[#A100FF] tracking-[0.25em] uppercase">
              Question {currentLevel + 1} —{" "}
              {PRIZE_LADDER[currentLevel]?.toLocaleString()}
            </p>
            <p className="text-4xl font-bold text-white leading-snug tracking-wide">
              {question.text}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto w-full">
            {question.answers.map((answer, idx) => (
              <AnswerButton
                key={idx}
                label={LABELS[idx]}
                text={answer}
                isCorrect={idx === question.correct}
                isRevealed={revealAnswer}
                isHidden={hiddenAnswers.includes(idx)}
                isPlayerAnswer={idx === playerAnswer}
              />
            ))}
          </div>
        </div>

        <PrizeLadder currentLevel={currentLevel} />
      </main>

      <AIColleagueOverlay
        aiThinking={aiThinking}
        aiReveal={aiReveal}
        question={question}
      />
    </div>
  );
}

// ── Done screen ────────────────────────────────────────────────────────────────

function DoneScreen({
  winner,
  eliminated,
  currentLevel,
}: {
  winner: string | null;
  eliminated: string | null;
  currentLevel: number;
}) {
  if (winner !== null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black">
        <div className="text-center space-y-6">
          <div className="text-9xl animate-bounce">🏆</div>
          <p className="text-5xl font-extrabold text-[#A100FF] tracking-widest uppercase">
            We Have a Winner!
          </p>
          <p className="text-7xl font-extrabold text-white tracking-wide">
            {winner}
          </p>
          <div className="mt-6 px-16 py-8 bg-[#A100FF] rounded-3xl shadow-[0_0_70px_rgba(161,0,255,0.6)]">
            <p className="text-2xl font-bold text-white uppercase tracking-widest">
              Wins
            </p>
            <p className="text-8xl font-extrabold text-white leading-none">
              {PRIZE_LADDER[currentLevel]?.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <div className="text-center space-y-6 px-12">
        <div className="text-9xl">❌</div>
        <p className="text-5xl font-extrabold text-red-400 tracking-widest uppercase">
          Eliminated!
        </p>
        <p className="text-7xl font-extrabold text-white tracking-wide">
          {eliminated}
        </p>
      </div>
    </div>
  );
}

// ── Page entry point ───────────────────────────────────────────────────────────

export default function ScreenPage() {
  useBroadcastSync("screen");

  const {
    phase,
    screenVisible,
    selectedPlayers,
    eliminated,
    currentContestant,
    currentQuestionIndex,
    revealAnswer,
    currentLevel,
    usedLifelines,
    hiddenAnswers,
    winner,
    playerAnswer,
    aiThinking,
    aiReveal,
  } = useGameStore();

  const question = QUESTIONS[currentQuestionIndex];

  if (!screenVisible) return <WaitingScreen />;

  if (phase === "idle" || phase === "spinning") {
    return <WheelPhaseScreen />;
  }

  if (phase === "selected") {
    return <SelectedScreen contestant={currentContestant} />;
  }

  if (phase === "quiz") {
    return (
      <GameScreen
        question={question}
        revealAnswer={revealAnswer}
        currentLevel={currentLevel}
        currentContestant={currentContestant}
        usedLifelines={usedLifelines}
        hiddenAnswers={hiddenAnswers}
        playerAnswer={playerAnswer}
        aiThinking={aiThinking}
        aiReveal={aiReveal}
      />
    );
  }

  if (phase === "done") {
    return (
      <DoneScreen
        winner={winner}
        eliminated={currentContestant}
        currentLevel={currentLevel}
      />
    );
  }

  return <WaitingScreen />;
}
