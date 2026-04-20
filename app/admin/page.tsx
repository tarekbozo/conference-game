"use client";

import { useGameStore } from "@/store/gameStore";
import { useBroadcastSync } from "@/hooks/useBroadcastSync";
import { QUESTIONS, PRIZE_LADDER } from "@/data/mockData";

const LABELS = ["A", "B", "C", "D"];

export default function AdminPage() {
  useBroadcastSync("admin");

  const {
    phase,
    allPlayers,
    selectedPlayers,
    eliminated,
    currentContestant,
    currentQuestionIndex,
    revealAnswer,
    currentLevel,
    spinRound,
    usedLifelines,
    gameOver,
    winner,
    screenVisible,
    playerAnswer,
    forcedWinner,
    spinOnce,
    showScreen,
    startQuiz,
    nextPlayer,
    nextQuestion,
    eliminateContestant,
    revealCurrentAnswer,
    selectPlayerAnswer,
    useLifeline5050,
    useLifelineSkip,
    useLifelineAI,
    setForcedWinner,
    resetGame,
  } = useGameStore();

  const availablePlayers = allPlayers.filter(
    (p) => !selectedPlayers.includes(p),
  );

  const question = QUESTIONS[currentQuestionIndex];

  // ── Phase badge colour ────────────────────────────────────────────────────────
  const phaseBadge: Record<string, string> = {
    idle: "bg-[#1A1A1A] text-[#A100FF]",
    spinning: "bg-[#A100FF]/20 text-[#A100FF]",
    selected: "bg-[#A100FF]/20 text-[#A100FF]",
    quiz: "bg-green-800 text-green-200",
    done: "bg-[#333333] text-white",
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-xl mx-auto p-5 space-y-4">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between py-2">
          <h1 className="text-xl font-bold text-[#A100FF] tracking-wide">
            Admin Panel
          </h1>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${phaseBadge[phase] ?? "bg-[#333333] text-white"}`}
            >
              {phase}
            </span>
            <a
              href="/screen"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#333333] rounded-lg text-xs font-medium transition-colors border border-[#333333]"
            >
              Open Screen ↗
            </a>
            <button
              onClick={resetGame}
              className="px-3 py-1.5 bg-red-900 hover:bg-red-800 rounded-lg text-xs font-medium transition-colors border border-red-800"
            >
              Reset
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            IDLE — spin to pick next contestant
        ════════════════════════════════════════════════════════════════════ */}
        {phase === "idle" && (
          <section className="bg-[#1A1A1A] rounded-2xl p-5 space-y-4 border border-[#333333]">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#A100FF] uppercase tracking-wider">
                Spin the Wheel
              </h2>
              <span className="text-sm text-[#666666] font-mono">
                Round{" "}
                <span className="text-white font-bold">{spinRound + 1}</span>
              </span>
            </div>

            {/* Show Screen */}
            <button
              onClick={showScreen}
              disabled={screenVisible}
              className={`w-full py-3 rounded-xl font-bold tracking-wide transition-all ${
                screenVisible
                  ? "bg-[#333333] opacity-40 cursor-not-allowed"
                  : "bg-emerald-700 hover:bg-emerald-600 active:scale-[0.98]"
              }`}
            >
              {screenVisible ? "✅ Screen visible" : "▶ Show Screen"}
            </button>

            {/* Spin */}
            <button
              disabled={!screenVisible || !forcedWinner}
              onClick={spinOnce}
              className={`w-full py-4 rounded-xl text-lg font-bold tracking-wide transition-all ${
                !screenVisible || !forcedWinner
                  ? "bg-[#333333] opacity-40 cursor-not-allowed"
                  : "bg-[#A100FF] hover:bg-[#8800dd] active:scale-[0.98]"
              }`}
            >
              🎡 Spin #{spinRound + 1}
            </button>

            {/* Force winner (admin-only, hidden from audience) */}
            <div className="space-y-1">
              <p className="text-xs text-[#666666] uppercase tracking-widest">
                Force winner (hidden from audience)
              </p>
              <select
                value={forcedWinner ?? ""}
                onChange={(e) =>
                  setForcedWinner(e.target.value || null)
                }
                className="w-full bg-[#1A1A1A] border border-[#333333] text-[#666666] text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#A100FF]"
              >
                <option value="">— Random (default) —</option>
                {availablePlayers.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected players so far */}
            {selectedPlayers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-[#666666] uppercase tracking-widest">
                  Selected so far
                </p>
                {selectedPlayers.map((p, i) => (
                  <div
                    key={p}
                    className="flex items-center gap-3 bg-[#1A1A1A] rounded-lg px-4 py-2.5 border border-[#333333]"
                  >
                    <span className="text-[#A100FF] font-bold w-5 text-sm">
                      {i + 1}.
                    </span>
                    <span
                      className={`font-medium text-sm ${eliminated.includes(p) ? "line-through text-[#666666]" : ""}`}
                    >
                      {p}
                    </span>
                    {eliminated.includes(p) && (
                      <span className="ml-auto text-xs text-red-400">
                        eliminated
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SPINNING — wheel animating
        ════════════════════════════════════════════════════════════════════ */}
        {phase === "spinning" && (
          <section className="bg-[#1A1A1A] rounded-2xl p-5 space-y-4 border border-[#333333]">
            <h2 className="text-base font-semibold text-[#A100FF] uppercase tracking-wider">
              Spinning…
            </h2>
            <button
              disabled
              className="w-full py-4 bg-[#A100FF]/20 opacity-70 cursor-not-allowed rounded-xl text-lg font-bold tracking-wide"
            >
              ⏳ Spinning…
            </button>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SELECTED — contestant revealed, start quiz
        ════════════════════════════════════════════════════════════════════ */}
        {phase === "selected" && (
          <section className="bg-[#1A1A1A] rounded-2xl p-5 space-y-4 border border-[#333333]">
            <h2 className="text-base font-semibold text-[#A100FF] uppercase tracking-wider">
              Contestant Selected
            </h2>
            <div className="text-center py-4">
              <p className="text-xs text-[#666666] uppercase tracking-widest mb-2">
                Next up
              </p>
              <p className="text-3xl font-extrabold text-[#A100FF]">
                {currentContestant}
              </p>
            </div>
            <button
              onClick={startQuiz}
              className="w-full py-4 bg-green-700 hover:bg-green-600 active:scale-[0.98] rounded-xl text-lg font-bold tracking-wide transition-all"
            >
              🎮 Start Quiz
            </button>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            QUIZ — question + answer controls
        ════════════════════════════════════════════════════════════════════ */}
        {phase === "quiz" && question && (
          <div className="space-y-3">
            {/* Status bar */}
            <div className="bg-[#1A1A1A] rounded-2xl px-5 py-4 flex justify-between items-center border border-[#333333]">
              <div>
                <p className="text-xs text-[#666666] uppercase tracking-widest">
                  Contestant
                </p>
                <p className="text-lg font-bold text-[#A100FF]">
                  {currentContestant}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-[#666666] uppercase tracking-widest">
                  Question
                </p>
                <p className="text-lg font-bold text-white">
                  {currentQuestionIndex + 1} / {QUESTIONS.length}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#666666] uppercase tracking-widest">
                  Playing for
                </p>
                <p className="text-lg font-bold text-green-400">
                  {PRIZE_LADDER[currentLevel]?.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Lifelines */}
            <div className="bg-[#1A1A1A] rounded-2xl px-5 py-4 border border-[#333333]">
              <p className="text-xs text-[#666666] uppercase tracking-widest mb-3">
                Lifelines
              </p>
              <div className="flex gap-2">
                {[
                  { id: "5050", label: "50:50", action: useLifeline5050 },
                  { id: "skip", label: "⏭ Skip", action: useLifelineSkip },
                  {
                    id: "ai",
                    label: "🤖 AI",
                    action: useLifelineAI,
                  },
                ].map(({ id, label, action }) => (
                  <button
                    key={id}
                    onClick={action}
                    disabled={usedLifelines.includes(id)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                      usedLifelines.includes(id)
                        ? "bg-[#1A1A1A] opacity-30 cursor-not-allowed line-through"
                        : "bg-[#A100FF] hover:bg-[#8800dd]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question preview */}
            <div className="bg-[#1A1A1A] rounded-2xl px-5 py-4 border border-[#333333]">
              <p className="text-xs text-[#666666] uppercase tracking-widest mb-2">
                Current question
              </p>
              <p className="text-sm font-medium leading-relaxed text-gray-100 mb-4">
                {question.text}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {question.answers.map((answer, idx) => (
                  <div
                    key={idx}
                    className={`px-3 py-2 rounded-lg text-xs border transition-all ${
                      revealAnswer
                        ? idx === question.correct
                          ? "bg-green-800 border-green-600 font-bold"
                          : "bg-[#1A1A1A] border-[#333333] opacity-40"
                        : "bg-[#1A1A1A] border-[#333333]"
                    }`}
                  >
                    <span className="text-[#A100FF] font-bold mr-1.5">
                      {LABELS[idx]})
                    </span>
                    {answer}
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="bg-[#1A1A1A] rounded-2xl px-5 py-4 border border-[#333333] space-y-3">
              {!revealAnswer ? (
                <>
                  <div className="space-y-2">
                    <p className="text-xs text-[#666666] uppercase tracking-widest">
                      Player's answer
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {LABELS.map((label, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectPlayerAnswer(idx)}
                          className={`py-2.5 rounded-lg text-sm font-bold transition-colors ${
                            playerAnswer === idx
                              ? "bg-[#A100FF] text-white"
                              : "bg-[#1A1A1A] hover:bg-[#333333] text-gray-200"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={revealCurrentAnswer}
                    disabled={playerAnswer === null}
                    className={`w-full py-4 rounded-xl font-bold text-base tracking-wide transition-colors ${
                      playerAnswer === null
                        ? "bg-[#333333] opacity-40 cursor-not-allowed"
                        : "bg-[#A100FF] hover:bg-[#8800dd]"
                    }`}
                  >
                    🔍 Reveal Answer
                  </button>
                </>
              ) : (
                <>
                  <p className="text-center text-xs text-[#666666] uppercase tracking-widest">
                    Was the answer correct?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={nextQuestion}
                      className="py-3.5 bg-green-700 hover:bg-green-600 rounded-xl font-bold transition-colors"
                    >
                      ✅ Correct
                    </button>
                    <button
                      onClick={eliminateContestant}
                      className="py-3.5 bg-red-800 hover:bg-red-700 rounded-xl font-bold transition-colors"
                    >
                      ❌ Wrong
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            DONE — result + next player
        ════════════════════════════════════════════════════════════════════ */}
        {phase === "done" && (
          <section
            className={`rounded-2xl p-6 space-y-4 border text-center ${winner !== null ? "bg-green-950 border-green-800" : "bg-red-950 border-red-900"}`}
          >
            {winner !== null ? (
              <>
                <div className="text-4xl">🏆</div>
                <h2 className="text-xl font-bold text-green-400">Winner!</h2>
                <p className="text-lg text-white">{winner}</p>
                <p className="text-2xl font-extrabold text-green-400">
                  {PRIZE_LADDER[currentLevel]?.toLocaleString()}
                </p>
              </>
            ) : (
              <>
                <div className="text-4xl">❌</div>
                <h2 className="text-xl font-bold text-red-400">Eliminated</h2>
                <p className="text-lg text-white">{currentContestant}</p>
              </>
            )}
            <button
              onClick={nextPlayer}
              className="w-full py-3.5 bg-[#A100FF] hover:bg-[#8800dd] rounded-xl font-bold transition-colors"
            >
              → Next Player
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
