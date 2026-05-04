"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore, SPIN_DURATION } from "@/store/gameStore";
import { useBroadcastSync } from "@/hooks/useBroadcastSync";
import { useScreenAudio } from "@/hooks/useScreenAudio";
import { ALL_PLAYERS, PlayerQuestion } from "@/data/mockData";
import SlotDrum from "@/components/SlotDrum";

const ROUND_LABELS: Record<number, string> = {
  0: "Easy",
  1: "Medium",
  2: "Hard",
};

const LABELS = ["A", "B", "C", "D"];

// ── Waiting / idle ─────────────────────────────────────────────────────────────

function WaitingScreen({
  audioEnabled,
  onEnableAudio,
}: {
  audioEnabled: boolean;
  onEnableAudio: () => void;
}) {
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

      {!audioEnabled && (
        <button
          type="button"
          onClick={onEnableAudio}
          className="fixed bottom-4 right-4 z-50 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 opacity-25 hover:opacity-100"
        >
          Click to enable audio
        </button>
      )}
    </div>
  );
}

// ── Intermission ───────────────────────────────────────────────────────────────

function IntermissionScreen() {
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

      {/* Centered content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-[3vh]">
        <p
          className="font-black text-white uppercase tracking-[0.12em] leading-none"
          style={{ fontSize: "6vw" }}
        >
          GET READY...
        </p>
        <p
          className="text-[#666666] tracking-widest"
          style={{ fontSize: "1.6vw" }}
        >
          Next question coming up
        </p>
        <div className="flex gap-4 mt-[2vh]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block w-4 h-4 rounded-full bg-[#A100FF]"
              style={{
                animation: `pulse 1.4s ease-in-out ${i * 0.22}s infinite`,
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.2; transform: scale(0.8); }
            50%       { opacity: 1;   transform: scale(1.2); }
          }
        `}</style>
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
    // style={{ height: windowH }}
    // className="relative rounded-xl border-2 border-[#A100FF] bg-black overflow-hidden shadow-[0_0_28px_rgba(161,0,255,0.35)]"
    >
      {/* scrolling strip */}
      {/* <div
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
      </div> */}

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
    currentContestant,
    spinRound,
    selectedPlayers,
    eliminated,
    wheelPlayers,
  } = useGameStore();

  const spinning = phase === "spinning";

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
          names={wheelPlayers}
          spinning={spinning}
          finalName={spinning ? null : currentContestant}
        />
        <SlotDrum
          players={wheelPlayers}
          spinning={spinning}
          finalName={currentContestant}
          //spinDuration={SPIN_DURATION}
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

const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"];

function PrizeLadder({ currentLevel }: { currentLevel: number }) {
  return (
    <div className="flex flex-col gap-[6px] w-56 shrink-0 self-start pt-2">
      {[...DIFFICULTY_LEVELS].reverse().map((label, ri) => {
        const idx = DIFFICULTY_LEVELS.length - 1 - ri;
        const isCurrent = idx === currentLevel;
        const isAbove = idx > currentLevel;

        let fill = "transparent";
        let stroke = "#333333";
        let textColor = "text-white";

        if (isCurrent) {
          // colors handled by SVG gradient instead
        } else if (isAbove) {
          fill = "transparent";
          stroke = "#333333";
          textColor = "text-[#333333]";
        } else {
          fill = "#1A1A1A";
          stroke = "#333333";
        }

        return (
          <div
            key={idx}
            className={`relative h-[36px] w-full ${
              isCurrent ? "scale-[1.05]" : ""
            }`}
          >
            {/* SVG background */}
            {isCurrent ? (
              <svg
                viewBox="0 0 300 36"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full drop-shadow-[0_0_12px_rgba(255,180,0,0.6)]"
              >
                <defs>
                  <linearGradient
                    id={`goldGrad-${idx}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#ffd54f" />
                    <stop offset="50%" stopColor="#ffb300" />
                    <stop offset="100%" stopColor="#ff8f00" />
                  </linearGradient>

                  <linearGradient
                    id={`goldStroke-${idx}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="#fff8e1" />
                    <stop offset="100%" stopColor="#ffcc80" />
                  </linearGradient>
                </defs>

                <path
                  d="
                    M 260 4
                    H 30
                    C 20 4 12 18 4 18
                    C 12 18 20 32 30 32
                    H 260
                    C 270 32 278 18 296 18
                    C 278 18 270 4 260 4
                    Z
                  "
                  fill={`url(#goldGrad-${idx})`}
                  stroke={`url(#goldStroke-${idx})`}
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 300 36"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
              >
                <path
                  d="
                    M 260 4
                    H 30
                    C 20 4 12 18 4 18
                    C 12 18 20 32 30 32
                    H 260
                    C 270 32 278 18 296 18
                    C 278 18 270 4 260 4
                    Z
                  "
                  fill={fill}
                  stroke={stroke}
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            )}

            {/* CONTENT */}
            <div
              className={`relative z-10 flex items-center justify-between px-4 h-full text-xs font-bold ${textColor}`}
            >
              <span className="opacity-60 w-6 pl-1  tabular-nums">
                {idx + 1}
              </span>
              <span className="flex-1 capitalize">{label}</span>
            </div>
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
  side,
  isCorrect,
  isRevealed,
  isHidden,
  isPlayerAnswer,
}: {
  label: string;
  text: string;
  side: "left" | "right";
  isCorrect: boolean;
  isRevealed: boolean;
  isHidden: boolean;
  isPlayerAnswer: boolean;
}) {
  if (isHidden) {
    return <div className="h-[72px] opacity-20" />;
  }

  let fill = "#070018";
  let stroke = "#d7d2ff";
  let shadow = "";

  if (isRevealed) {
    if (isCorrect) {
      fill = "#00c853";
      stroke = "#b9f6ca";
      shadow = "drop-shadow-[0_0_18px_rgba(0,255,170,0.7)]";
    } else if (isPlayerAnswer) {
      fill = "#d50000";
      stroke = "#ff8a80";
      shadow = "drop-shadow-[0_0_18px_rgba(255,0,0,0.7)]";
    } else {
      fill = "#070018";
      stroke = "#2a2545";
      shadow = "opacity-30";
    }
  } else if (isPlayerAnswer) {
    fill = "#ff8a00";
    stroke = "#ffd180";
    shadow = "drop-shadow-[0_0_18px_rgba(255,138,0,0.7)]";
  }

  return (
    <div className={`relative z-10 h-[72px] w-full ${shadow}`}>
      <svg
        viewBox="0 0 600 72"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <path
          d="
            M 480 6
            H 120
            C 95 6 80 36 55 36
            C 80 36 95 66 120 66
            H 480
            C 505 66 520 36 545 36
            C 520 36 505 6 480 6
            Z
          "
          fill={fill}
          stroke={stroke}
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* only draw OUTER connector lines */}
        {side === "left" && (
          <line
            x1="0"
            y1="36"
            x2="55"
            y2="36"
            stroke={stroke}
            strokeWidth="3"
          />
        )}

        {side === "right" && (
          <line
            x1="545"
            y1="36"
            x2="600"
            y2="36"
            stroke={stroke}
            strokeWidth="3"
          />
        )}
      </svg>

      <div className="relative z-10 flex h-full items-center gap-5 px-28">
        <span className="w-10 shrink-0 text-xl font-extrabold text-[#ff8a00]">
          {label}:
        </span>

        <span className="text-lg font-semibold text-white">{text}</span>
      </div>
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
}: {
  aiThinking: boolean;
  aiReveal: boolean;
}) {
  const { activeQuestion, aiWrongAnswer } = useGameStore();
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

  console.log(aiWrongAnswer);
  const wrongText = activeQuestion?.answers[aiWrongAnswer ?? 0] ?? "";
  const wrongLabel = ["A", "B", "C", "D"][aiWrongAnswer ?? 0];

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
                {wrongLabel}
              </span>
              <span className="text-3xl font-bold text-green-300 leading-snug">
                {wrongText}
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
  revealAnswer,
  currentContestant,
  playerAnswer,
  aiThinking,
  aiReveal,
}: {
  revealAnswer: boolean;
  currentContestant: string | null;
  playerAnswer: number | null;
  aiThinking: boolean;
  aiReveal: boolean;
}) {
  const { activeQuestion, hiddenAnswers, usedLifelines } = useGameStore();
  if (!activeQuestion) return null;
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#050017] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,#38108f_0%,#08001f_38%,#010006_75%)] opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_58%,rgba(255,255,255,0.22),transparent_18%)]" />

      <header className="relative z-10 flex items-center justify-between px-10 py-5">
        <div className="flex gap-3">
          {[
            { label: "50:50", emoji: "✂️", id: "5050" },
            { label: "AI Colleague", emoji: "🤖", id: "ai" },
          ].map(({ label, emoji, id }) => {
            const used = usedLifelines.includes(id);

            return (
              <div
                key={label}
                className={`flex items-center gap-2 rounded-full border-2 px-5 py-2.5 text-base font-bold tracking-wide shadow-[0_0_18px_rgba(255,255,255,0.18)] ${
                  used
                    ? "border-slate-600 bg-[#120d25] text-slate-500 opacity-45 line-through"
                    : "border-[#d7d2ff] bg-[#10002c] text-[#f2eaff]"
                }`}
              >
                <span className="text-lg">{used ? "✕" : emoji}</span>
                <span>{label}</span>
              </div>
            );
          })}
        </div>

        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
            Contestant
          </p>
          <p className="text-3xl font-extrabold tracking-wide text-[#f2eaff] drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]">
            {currentContestant}
          </p>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 gap-8 px-8 pb-12 pt-8">
        <div className="flex flex-1 flex-col justify-end gap-8 pb-10">
          <div className="mx-auto w-full max-w-6xl">
            <p className="mb-3 text-center text-sm uppercase tracking-[0.35em] text-[#ff8a00]">
              {activeQuestion?.difficulty ?? "—"}
            </p>

            <div className="relative w-full max-w-5xl mx-auto h-[120px]">
              {/* SVG background */}
              <svg
                viewBox="0 0 800 120"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
              >
                <path
                  d="
        M 680 10
        H 120
        C 90 10 70 60 40 60
        C 70 60 90 110 120 110
        H 680
        C 710 110 730 60 760 60
        C 730 60 710 10 680 10
        Z
      "
                  fill="#070018"
                  stroke="#d7d2ff"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />

                {/* connector lines */}
                <line
                  x1="760"
                  y1="60"
                  x2="800"
                  y2="60"
                  stroke="#d7d2ff"
                  strokeWidth="4"
                />
                <line
                  x1="0"
                  y1="60"
                  x2="40"
                  y2="60"
                  stroke="#d7d2ff"
                  strokeWidth="4"
                />
              </svg>

              {/* TEXT */}
              <div className="relative z-10 flex h-full items-center justify-center px-20 text-center">
                <p className="text-4xl font-semibold leading-snug tracking-wide text-white">
                  {activeQuestion?.question}
                </p>
              </div>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
            {[0, 2].map((start) => (
              <div key={start} className="relative grid grid-cols-2 gap-x-20">
                {/* middle connector between left and right answers */}
                <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[3px] w-48 -translate-x-1/2 -translate-y-1/2 bg-[#d7d2ff]" />

                {activeQuestion.answers
                  .slice(start, start + 2)
                  .map((answer, i) => {
                    const idx = start + i;

                    return (
                      <AnswerButton
                        key={idx}
                        label={LABELS[idx]}
                        text={answer}
                        side={i === 0 ? "left" : "right"}
                        isCorrect={idx === activeQuestion.correct}
                        isRevealed={revealAnswer}
                        isHidden={hiddenAnswers.includes(idx)}
                        isPlayerAnswer={idx === playerAnswer}
                      />
                    );
                  })}
              </div>
            ))}
          </div>
        </div>

        <PrizeLadder
          currentLevel={activeQuestion ? activeQuestion.round - 1 : 0}
        />
      </main>

      <AIColleagueOverlay aiThinking={aiThinking} aiReveal={aiReveal} />
    </div>
  );
}

// ── Winner screen ──────────────────────────────────────────────────────────────

function WinnerScreen({ name }: { name: string | null }) {
  return (
    <div className="flex flex-col items-center min-h-screen bg-black overflow-hidden relative">
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes winnerName {
          0%   { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        .confetti-piece {
          position: absolute;
          top: 0;
          width: 12px;
          height: 18px;
          border-radius: 3px;
          animation: confettiFall linear infinite;
        }
        .winner-name {
          animation: winnerName 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>

      {/* Confetti */}
      {[
        { left: "5%", delay: "0s", dur: "3.2s", color: "#A100FF" },
        { left: "10%", delay: "0.4s", dur: "2.8s", color: "#FFD700" },
        { left: "16%", delay: "0.1s", dur: "3.5s", color: "#00E5FF" },
        { left: "22%", delay: "0.7s", dur: "2.6s", color: "#FF4081" },
        { left: "28%", delay: "0.3s", dur: "3.1s", color: "#A100FF" },
        { left: "34%", delay: "0.9s", dur: "2.9s", color: "#69FF47" },
        { left: "40%", delay: "0.2s", dur: "3.4s", color: "#FFD700" },
        { left: "46%", delay: "0.6s", dur: "2.7s", color: "#FF4081" },
        { left: "52%", delay: "0.0s", dur: "3.0s", color: "#A100FF" },
        { left: "58%", delay: "0.5s", dur: "3.3s", color: "#00E5FF" },
        { left: "64%", delay: "0.8s", dur: "2.5s", color: "#69FF47" },
        { left: "70%", delay: "0.15s", dur: "3.6s", color: "#FFD700" },
        { left: "76%", delay: "0.45s", dur: "2.8s", color: "#FF4081" },
        { left: "82%", delay: "0.65s", dur: "3.2s", color: "#A100FF" },
        { left: "88%", delay: "0.25s", dur: "2.9s", color: "#00E5FF" },
        { left: "93%", delay: "0.75s", dur: "3.1s", color: "#69FF47" },
        { left: "12%", delay: "1.1s", dur: "2.7s", color: "#FFD700" },
        { left: "37%", delay: "1.3s", dur: "3.4s", color: "#FF4081" },
        { left: "61%", delay: "1.0s", dur: "2.6s", color: "#A100FF" },
        { left: "85%", delay: "1.2s", dur: "3.0s", color: "#69FF47" },
      ].map((p, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: p.left,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.dur,
          }}
        />
      ))}

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

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-[3vh]">
        <div style={{ fontSize: "12vw", lineHeight: 1 }}>🏆</div>
        <p
          className="font-black text-white uppercase tracking-[0.12em]"
          style={{ fontSize: "6vw" }}
        >
          WINNER!
        </p>
        <p
          className="winner-name font-black uppercase tracking-[0.06em]"
          style={{ fontSize: "8vw", color: "#A100FF" }}
        >
          {name}
        </p>
      </div>
    </div>
  );
}

// ── Done screen ────────────────────────────────────────────────────────────────

function DoneScreen({ eliminated }: { eliminated: string | null }) {
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

  const [audioEnabled, setAudioEnabled] = useState(false);

  const {
    phase,
    screenVisible,
    currentContestant,
    winnerName,
    activeQuestion,
    revealAnswer,
    playerAnswer,
    aiThinking,
    aiReveal,
    usedLifelines,
  } = useGameStore();

  useScreenAudio({
    phase,
    screenVisible,
    revealAnswer,
    playerAnswer,
    currentQuestionCorrect: activeQuestion?.correct ?? 0,
    currentLevel: activeQuestion?.round ?? 1,
    usedLifelines,
    audioEnabled,
  });

  if (!screenVisible)
    return (
      <WaitingScreen
        audioEnabled={audioEnabled}
        onEnableAudio={() => setAudioEnabled(true)}
      />
    );

  if (phase === "idle" || phase === "spinning") {
    return <WheelPhaseScreen />;
  }

  if (phase === "selected") {
    return <SelectedScreen contestant={currentContestant} />;
  }

  if (phase === "quiz") {
    return (
      <GameScreen
        revealAnswer={revealAnswer}
        currentContestant={currentContestant}
        playerAnswer={playerAnswer}
        aiThinking={aiThinking}
        aiReveal={aiReveal}
      />
    );
  }

  if (phase === "intermission") {
    return <IntermissionScreen />;
  }

  if (phase === "winner") {
    return <WinnerScreen name={winnerName} />;
  }

  if (phase === "done") {
    return <DoneScreen eliminated={currentContestant} />;
  }

  return (
    <WaitingScreen
      audioEnabled={audioEnabled}
      onEnableAudio={() => setAudioEnabled(true)}
    />
  );
}
