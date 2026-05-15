"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { useBroadcastSync } from "@/hooks/useBroadcastSync";
import { PLAYERS, PlayerQuestion } from "@/data/mockData";

const LABELS = ["A", "B", "C", "D"];

const DIFF_CLS = {
  easy: "text-green-400 border-green-600 bg-green-900/30",
  medium: "text-amber-400 border-amber-600 bg-amber-900/30",
  hard: "text-red-400 border-red-600 bg-red-900/30",
} as const;

const PHASE_BADGE: Record<string, string> = {
  idle: "bg-[#1A1A1A] text-[#A100FF]",
  spinning: "bg-[#A100FF]/20 text-[#A100FF]",
  selected: "bg-[#A100FF]/20 text-[#A100FF]",
  reveal: "bg-[#A100FF]/30 text-white",
  quiz: "bg-green-800 text-green-200",
  done: "bg-[#333] text-white",
  reinventors: "bg-yellow-600 text-white",
};

export default function AdminPage() {
  useBroadcastSync("admin");

  const {
    phase,
    selectedPlayers,
    currentContestant,
    eliminated,
    activeQuestion,
    playerAnswer,
    revealAnswer,
    hiddenAnswers,
    aiThinking,
    spinOnce,
    showScreen,
    setActiveQuestion,
    revealTrapAnswer,
    selectPlayerAnswer,
    revealCurrentAnswer,
    markCorrect,
    markWrong,
    nextPlayer,
    readyForNextSpin,
    startQuiz,
    resetGame,
    use5050,
    useLifelineAI,
    usedLifelines,
    winnerName,
    reinventors,
    raffleQueue,
    raffleIndex,
    wheelSpinning,
    screenVisible,
    spinRound,
    skipReveal,
    showReinventors,
  } = useGameStore();

  const [winner1, setWinner1] = useState(PLAYERS[0].name);
  const [winner2, setWinner2] = useState(PLAYERS[1].name);

  const handleSetActiveQuestion = (q: PlayerQuestion) => {
    setActiveQuestion(q);
  };

  const handleLifeline = (id: string, action: () => void) => {
    if (usedLifelines.includes(id)) return;
    action();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-5 space-y-4">
        {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
        <div className="flex-none h-24 border-b border-[#333] flex justify-between px-4 gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-bold text-[#A100FF] tracking-wide">
              Admin Panel
            </h1>
            <div className="flex items-center gap-2 px-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${PHASE_BADGE[phase] ?? "bg-[#333] text-white"}`}
              >
                {phase}
              </span>
              <a
                href="/screen"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#333] rounded-lg text-xs font-medium border border-[#333] transition-colors"
              >
                Open Screen ↗
              </a>
              <button
                onClick={resetGame}
                className="px-3 py-1.5 bg-red-900 hover:bg-red-800 rounded-lg text-xs font-medium border border-red-800 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {(phase === "idle" || phase === "spinning") && (
            <div className="flex items-center gap-4">
              <button
                onClick={showScreen}
                disabled={screenVisible}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  screenVisible
                    ? "bg-[#333] opacity-40 cursor-not-allowed"
                    : "bg-emerald-700 hover:bg-emerald-600"
                }`}
              >
                {screenVisible ? "✅ Screen on" : "▶ Show Screen"}
              </button>
              <button
                disabled={!screenVisible || wheelSpinning || raffleIndex >= raffleQueue.length}
                onClick={spinOnce}
                className={`p-3 rounded-lg text-md font-bold tracking-wide transition-all ${
                  !screenVisible || wheelSpinning || raffleIndex >= raffleQueue.length
                    ? "bg-[#333] opacity-40 cursor-not-allowed"
                    : "bg-[#A100FF] hover:bg-[#8800dd]"
                }`}
              >
                {wheelSpinning ? "⏳ Spinning…" : `🎡 Start Raffle`}
              </button>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-[#666] uppercase tracking-widest">Raffle order</span>
                <div className="flex gap-2">
                  {raffleQueue.map((name, i) => (
                    <span
                      key={name}
                      className={`text-xs font-bold ${i < raffleIndex ? "text-[#666] line-through" : "text-white"}`}
                    >
                      {i < raffleIndex ? "✓ " : `${i + 1}. `}{name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {phase === "reveal" && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#A100FF] font-bold animate-pulse">
                Revealing name on screen…
              </span>
              <button
                disabled
                className="px-3 py-1.5 bg-[#333] opacity-40 cursor-not-allowed rounded-lg text-xs font-bold"
              >
                ⏳ Spinning…
              </button>
              <button
                onClick={skipReveal}
                className="px-4 py-3 bg-[#1A1A1A] hover:bg-[#333] border border-[#555] rounded-lg text-md font-bold transition-colors"
              >
                ⏭ Skip Reveal
              </button>
            </div>
          )}

          {phase === "selected" && (
            <div className="flex items-center gap-6">
              <span className="text-sm text-[#A100FF] font-bold flex-1">
                {currentContestant} selected
              </span>
              <button
                onClick={startQuiz}
                className="px-4 py-3 bg-[#A100FF] hover:bg-[#8800dd] rounded-lg text-md font-bold transition-colors"
              >
                🎮 Start Quiz
              </button>
              <button
                onClick={readyForNextSpin}
                className="px-4 py-3 bg-[#1A1A1A] hover:bg-[#333] border border-[#555] rounded-lg text-md font-bold transition-colors"
              >
                🔄 Spin Again
              </button>
            </div>
          )}

          {phase === "winner" && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-yellow-400 font-bold">
                🏆 {winnerName} won!
              </span>
              <button
                onClick={nextPlayer}
                className="ml-auto px-4 py-3 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-xs font-bold transition-colors"
              >
                🏆 Winner! Move to next player
              </button>
            </div>
          )}

          {phase === "reinventors" && (
            <div className="flex items-center gap-3">
              <span className="text-yellow-400 font-bold text-sm">
                🏆 {reinventors.join(" & ")} are Reinventors!
              </span>
              <button
                onClick={nextPlayer}
                className="px-4 py-3 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-xs font-bold"
              >
                🎉 Done — Reset for next round
              </button>
            </div>
          )}

          {phase === "done" && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-red-400 font-bold">
                {currentContestant} eliminated
              </span>
              <button
                onClick={nextPlayer}
                className="ml-auto px-4 py-3 bg-[#A100FF] hover:bg-[#8800dd] rounded-lg text-xs font-bold transition-colors"
              >
                ❌ Eliminated. Next player
              </button>
            </div>
          )}
        </div>

        {/* ── SECTION 1 — Current Question ─────────────────────────────────── */}
        <div className="flex-none h-[40%] border-b border-[#333] overflow-y-auto p-4">
          <p className="text-xs text-[#666] uppercase tracking-widest mb-3">
            Current Question
          </p>

          {!activeQuestion ? (
            <div className="flex items-center justify-center h-16 text-[#555] text-sm italic">
              No question selected — click a card below
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  {activeQuestion.playerName}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold border capitalize ${DIFF_CLS[activeQuestion.difficulty]}`}
                >
                  {activeQuestion.difficulty}
                </span>
              </div>

              <p className="text-base font-semibold text-white leading-snug">
                {activeQuestion.question}
              </p>

              <div className="grid grid-cols-4 gap-2">
                {activeQuestion.answers.map((answer, idx) => {
                  let cls =
                    "rounded-lg p-2 text-xs font-bold border transition-all text-center ";
                  if (revealAnswer) {
                    if (
                      !activeQuestion.trapAnswer &&
                      idx === activeQuestion.correct
                    ) {
                      cls += "bg-green-700 border-green-500 text-white";
                    } else if (
                      !activeQuestion.trapAnswer &&
                      idx === playerAnswer
                    ) {
                      cls += "bg-red-800 border-red-600 text-white";
                    } else {
                      cls +=
                        "bg-[#1A1A1A] border-[#333] text-[#555] opacity-40";
                    }
                  } else {
                    cls +=
                      idx === playerAnswer
                        ? "bg-[#A100FF] border-[#A100FF] text-white"
                        : "bg-[#1A1A1A] border-[#333] text-white hover:border-[#A100FF]/50 cursor-pointer";
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => !revealAnswer && selectPlayerAnswer(idx)}
                      disabled={revealAnswer}
                      className={cls}
                    >
                      <span className="block text-[10px] text-[#A100FF] font-extrabold mb-0.5">
                        {LABELS[idx]}
                      </span>
                      <span className="block leading-tight">{answer}</span>
                    </button>
                  );
                })}
              </div>

              {activeQuestion.trapAnswer && (
                <button
                  onClick={revealTrapAnswer}
                  className="w-full py-2 rounded-lg text-sm font-bold border border-amber-500 text-amber-400 bg-amber-900/20 hover:bg-amber-900/40 transition-colors"
                >
                  ⚠️ Reveal Option E
                </button>
              )}

              <div className="flex gap-6">
                {!revealAnswer && playerAnswer !== null && (
                  <button
                    onClick={revealCurrentAnswer}
                    className="flex-1 py-4 mt-4 mb-4 max-w-screen-md m-auto bg-[#A100FF] hover:bg-[#8800dd] rounded-lg text-sm font-bold transition-colors"
                  >
                    🔍 Reveal Answer
                  </button>
                )}
                {revealAnswer && (
                  <>
                    <button
                      onClick={markCorrect}
                      className="flex-1 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-bold transition-colors"
                    >
                      ✅ Correct
                    </button>
                    <button
                      onClick={markWrong}
                      className="flex-1 py-2 bg-red-800 hover:bg-red-700 rounded-lg text-sm font-bold transition-colors"
                    >
                      ❌ Wrong
                    </button>
                  </>
                )}
              </div>

              <div className="flex gap-2 max-w-4xl m-auto">
                {[
                  { id: "5050", label: "50/50", action: use5050 },
                  { id: "ai", label: "🤖 AI", action: useLifelineAI },
                ].map(({ id, label, action }) => {
                  const used = usedLifelines.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => handleLifeline(id, action)}
                      disabled={used}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                        used
                          ? "bg-[#1A1A1A] opacity-40 cursor-not-allowed line-through"
                          : "bg-[#A100FF] hover:bg-[#8800dd]"
                      }`}
                    >
                      {used ? `✕ ${label}` : label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION 2 — Question Overview ────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs text-[#666] uppercase tracking-widest mb-3">
            Question Overview
          </p>
          <div className="grid grid-cols-4 gap-3">
            {PLAYERS.map((player) => {
              const isEliminated = eliminated.includes(player.name);
              const isActive = player.name === currentContestant;
              return (
                <div
                  key={player.id}
                  className={
                    isEliminated
                      ? "opacity-30"
                      : eliminated.length > 0
                        ? "ring-1 ring-[#A100FF]/60 rounded-xl p-2 bg-[#A100FF]/5"
                        : ""
                  }
                >
                  <div className="mb-2">
                    <p className="text-sm font-bold text-white leading-tight">
                      {player.name}
                    </p>
                    {isEliminated && (
                      <span className="text-[11px] text-red-400 font-bold">
                        ✕ Eliminated
                      </span>
                    )}
                    {isActive && !isEliminated && (
                      <span className="text-[11px] text-[#A100FF] font-bold">
                        ● Active
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {player.questions.map((q) => {
                      const isActiveQ = activeQuestion?.id === q.id;
                      return (
                        <div
                          key={q.id}
                          onClick={() =>
                            !isEliminated && handleSetActiveQuestion(q)
                          }
                          className={`relative rounded-lg p-5 transition-all ${
                            isEliminated
                              ? "pointer-events-none bg-[#1A1A1A] border border-[#333]"
                              : isActiveQ
                                ? "border-2 border-[#A100FF] bg-[#1A1A1A] cursor-pointer"
                                : "bg-[#1A1A1A] border border-[#333] hover:border-[#A100FF]/50 cursor-pointer"
                          }`}
                        >
                          <span
                            className={`text-[16px] font-bold uppercase capitalize ${
                              q.difficulty === "easy"
                                ? "text-green-400"
                                : q.difficulty === "medium"
                                  ? "text-amber-400"
                                  : "text-red-400"
                            }`}
                          >
                            {q.difficulty}
                          </span>
                          <p className="text-[14px] text-gray-300 mt-2 line-clamp-2 leading-snug">
                            {q.question}
                          </p>
                          <div
                            className={`absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full border ${
                              isActiveQ
                                ? "bg-[#A100FF] border-[#A100FF]"
                                : "border-[#555]"
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* ── MANUAL CONTROLS ──────────────────────────────────────────────── */}
        <div className="border-t border-[#333] p-4">
          <p className="text-xs text-[#666] uppercase tracking-widest mb-3">
            Manual Controls
          </p>
          <div className="flex items-center gap-3">
            <input
              value={winner1}
              onChange={(e) => setWinner1(e.target.value)}
              placeholder="Winner 1"
              className="bg-[#1A1A1A] border border-[#333] text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-[#A100FF] w-48"
            />
            <input
              value={winner2}
              onChange={(e) => setWinner2(e.target.value)}
              placeholder="Winner 2"
              className="bg-[#1A1A1A] border border-[#333] text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-[#A100FF] w-48"
            />
            <button
              onClick={() => showReinventors(winner1, winner2)}
              disabled={!winner1.trim() || !winner2.trim()}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-bold transition-colors"
            >
              🏆 Show Winners Screen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
