"use client";

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#020218] to-[#05053a]">
      <div className="text-center space-y-4 px-8">
        <div className="text-7xl mb-6">🎭</div>
        <p className="text-4xl font-extrabold text-yellow-400 tracking-[0.12em] uppercase">
          Who Wants to Be a
        </p>
        <p className="text-7xl font-extrabold text-white tracking-[0.06em] uppercase leading-none">
          Reinventor?
        </p>
        <p className="text-2xl text-blue-300 mt-10 animate-pulse tracking-widest">
          Waiting for host…
        </p>
      </div>
    </div>
  );
}

// ── Wheel screen (idle + spinning) ─────────────────────────────────────────────

function WheelPhaseScreen() {
  const {
    phase,
    wheelPlayers,
    wheelTargetRotation,
    wheelRotation,
    spinRound,
    selectedPlayers,
    eliminated,
  } = useGameStore();

  const spinning = phase === "spinning";
  // When idle the wheel shows its last resting position
  const targetRotation = spinning ? wheelTargetRotation : wheelRotation;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020218] to-[#05053a] flex flex-col items-center justify-center gap-6 px-6 py-8">
      <p className="text-3xl font-extrabold text-yellow-400 tracking-widest uppercase">
        🎡 Who's Playing Tonight?
      </p>

      <div className="flex items-center gap-14">
        {/* Wheel */}
        <div className="flex flex-col items-center gap-4">
          <SpinningWheel
            players={wheelPlayers}
            targetRotation={targetRotation}
            spinning={spinning}
            spinDuration={SPIN_DURATION}
          />
          <p className="text-sm text-gray-400 tracking-widest">
            Round{" "}
            <span className="text-white font-bold">{spinRound + 1}</span>
          </p>
        </div>

        {/* Selected list */}
        {selectedPlayers.length > 0 && (
          <div className="flex flex-col gap-3 min-w-[260px]">
            <p className="text-xs text-gray-500 uppercase tracking-[0.2em] mb-1">
              Selected
            </p>
            {selectedPlayers.map((player, i) => {
              const isElim = eliminated.includes(player);
              return (
                <div
                  key={player}
                  className={`flex items-center gap-4 border-2 rounded-full px-6 py-3 transition-all ${
                    isElim
                      ? "bg-gray-900 border-gray-700 opacity-40"
                      : "bg-[#0d1b4b] border-blue-500"
                  }`}
                >
                  <span className="text-xl font-bold text-yellow-400 w-6">
                    {i + 1}.
                  </span>
                  <span className={`text-xl font-bold text-white ${isElim ? "line-through" : ""}`}>
                    {player}
                  </span>
                  {isElim && <span className="ml-auto text-base">❌</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Selected screen ────────────────────────────────────────────────────────────

function SelectedScreen({ contestant }: { contestant: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#020218] to-[#05053a]">
      <div className="text-center space-y-6 px-12">
        <p className="text-3xl font-bold text-blue-300 tracking-[0.2em] uppercase animate-pulse">
          Next Contestant
        </p>
        <p className="text-8xl font-extrabold text-yellow-400 tracking-wide leading-none">
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
                ? "bg-yellow-500 text-black shadow-[0_0_18px_rgba(234,179,8,0.6)] scale-[1.06] text-sm py-2"
                : isSafe && !isAbove
                  ? "bg-[#2a1500] border border-amber-700 text-amber-400"
                  : isAbove
                    ? "bg-transparent text-gray-700"
                    : "bg-[#0d1b4b] border border-blue-900/60 text-blue-300"
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
      look = `${base} bg-gray-900 border-gray-700 opacity-20`;
    }
  } else {
    look = isPlayerAnswer
      ? `${base} bg-amber-500 border-amber-300 shadow-[0_0_26px_rgba(245,158,11,0.5)]`
      : `${base} bg-[#0d1b4b] border-[#4169e1]`;
  }

  return (
    <div className={look}>
      <span className="text-xl font-extrabold text-yellow-400 w-7 shrink-0">
        {label}
      </span>
      <span className="text-lg font-semibold text-white leading-snug">
        {text}
      </span>
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
}: {
  question: Question;
  revealAnswer: boolean;
  currentLevel: number;
  currentContestant: string | null;
  usedLifelines: string[];
  hiddenAnswers: number[];
  playerAnswer: number | null;
}) {
  const lifelines = [
    { id: "5050",      label: "50:50",     emoji: "✂️" },
    { id: "skip",      label: "Skip",      emoji: "⏭" },
    { id: "colleague", label: "Colleague", emoji: "👥" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#020218] via-[#020a2a] to-[#05053a]">
      <header className="flex items-center justify-between px-10 py-5 border-b border-blue-900/40">
        <div className="flex gap-3">
          {lifelines.map(({ id, label, emoji }) => (
            <div
              key={id}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border-2 font-bold text-base tracking-wide transition-all ${
                usedLifelines.includes(id)
                  ? "bg-transparent border-gray-800 text-gray-700 line-through opacity-40"
                  : "bg-[#0d1b4b] border-yellow-500 text-yellow-300"
              }`}
            >
              <span className="text-lg">{emoji}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-[0.2em]">
            Contestant
          </p>
          <p className="text-3xl font-extrabold text-yellow-400 tracking-wide">
            {currentContestant}
          </p>
        </div>
      </header>

      <main className="flex flex-1 gap-6 px-10 py-6">
        <div className="flex-1 flex flex-col justify-center gap-10">
          <div className="text-center space-y-3 px-4">
            <p className="text-sm text-blue-400 tracking-[0.25em] uppercase">
              Question {currentLevel + 1} — {PRIZE_LADDER[currentLevel]?.toLocaleString()}
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#020218] to-[#05053a]">
        <div className="text-center space-y-6">
          <div className="text-9xl animate-bounce">🏆</div>
          <p className="text-5xl font-extrabold text-yellow-400 tracking-widest uppercase">
            We Have a Winner!
          </p>
          <p className="text-7xl font-extrabold text-white tracking-wide">
            {winner}
          </p>
          <div className="mt-6 px-16 py-8 bg-yellow-500 rounded-3xl shadow-[0_0_70px_rgba(234,179,8,0.6)]">
            <p className="text-2xl font-bold text-black uppercase tracking-widest">
              Wins
            </p>
            <p className="text-8xl font-extrabold text-black leading-none">
              {PRIZE_LADDER[currentLevel]?.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#020218] to-[#05053a]">
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
