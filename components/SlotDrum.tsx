"use client";

import { SPIN_DURATION } from "@/store/gameStore";
import { WHEEL_NAMES } from "@/data/mockData";
import { useEffect, useRef, useState } from "react";

// ─── Configuration ────────────────────────────────────────────────────────────

/** How many name-bars are visible in the drum window at once (must be odd). */
const VISIBLE = 15;
const CENTER = Math.floor(VISIBLE / 2); // index 7

/** Fixed pixel height of every bar in the strip. */
const BAR_HEIGHT = 52;

/** Gap between bars (px). */
const BAR_GAP = 4;

/** Full step size per bar slot (height + gap). */
const STEP = BAR_HEIGHT + BAR_GAP;

/**
 * Total number of names in the spin strip (excluding the lead-in from the
 * previous visible state and the tail padding).
 * At peak speed (t=0.5 with sine easing) the drum moves through roughly
 * TOTAL_NAMES / (SPIN_DURATION_s * π/2) names per second.
 * 120 names / (10s * 1.57) ≈ 7.6 names/sec at peak — fast but readable.
 * Increase to slow down, decrease to speed up.
 */
const TOTAL_NAMES = 60;

// ─── Easing ───────────────────────────────────────────────────────────────────

/**
 * Quintic ease-in-out. Spends ~45% of time at low speed at each end,
 * giving a long readable slow-tick at start and finish.
 */
function easeInOutQuint(t: number): number {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomNames(pool: string[], count: number): string[] {
  const source = shuffle(pool);
  const result: string[] = [];
  while (result.length < count) result.push(...source);
  return result.slice(0, count);
}

/** Build the initial idle strip — enough names to fill the visible window. */
function buildIdleStrip(pool: string[]): string[] {
  return randomNames(pool, VISIBLE + 4);
}

/**
 * Build the animated strip for one spin.
 *
 * Layout:
 *   [leadIn: VISIBLE names]   ← exactly what was on screen when drum last stopped,
 *                                so animation starts from a visually identical state
 *   [TOTAL_NAMES random]      ← the bulk of the spin
 *   [winner]                  ← always lands here
 *   [tail: CENTER+2 padding]  ← so bottom never goes blank
 *
 * Animation starts at translateForIndex(CENTER) — strip[CENTER] centered,
 * which is the same position the idle/stopped drum was in.
 * Animation ends at translateForIndex(winnerStripIndex).
 */
function buildSpinStrip(
  winner: string,
  pool: string[],
  lastVisible: string[] // exactly VISIBLE names that were showing
): { strip: string[]; winnerStripIndex: number } {
  const noWinner = pool.filter((n) => n !== winner);
  const bulk = randomNames(noWinner, TOTAL_NAMES);
  const tail = randomNames(noWinner, CENTER + 2);

  // leadIn is the full VISIBLE window from the previous stop, so the strip
  // starts exactly where the previous drum ended.
  const leadIn = lastVisible.slice(0, VISIBLE);

  const strip = [...leadIn, ...bulk, winner, ...tail];
  const winnerStripIndex = leadIn.length + TOTAL_NAMES;

  return { strip, winnerStripIndex };
}

// ─── translateY helper ────────────────────────────────────────────────────────

function translateForIndex(idx: number): number {
  return -(idx * STEP) + CENTER * STEP + BAR_GAP / 2;
}

// ─── Bar appearance table ─────────────────────────────────────────────────────

const slotStyles = [
  { width: "100%", fontSize: 20, fontWeight: 800, opacity: 1,    borderRadius: 14 },
  { width:  "92%", fontSize: 16, fontWeight: 700, opacity: 0.88, borderRadius: 16 },
  { width:  "84%", fontSize: 13, fontWeight: 600, opacity: 0.65, borderRadius: 20 },
  { width:  "74%", fontSize: 11, fontWeight: 500, opacity: 0.42, borderRadius: 24 },
  { width:  "63%", fontSize:  9, fontWeight: 400, opacity: 0.25, borderRadius: 28 },
  { width:  "52%", fontSize:  7, fontWeight: 300, opacity: 0.14, borderRadius: 32 },
  { width:  "40%", fontSize:  0, fontWeight: 200, opacity: 0.08, borderRadius: 36 },
  { width:  "28%", fontSize:  0, fontWeight: 100, opacity: 0.04, borderRadius: 40 },
];

// ─── Component ────────────────────────────────────────────────────────────────

export interface SlotDrumProps {
  players: string[];
  spinning: boolean;
  finalName: string | null;
  winnerIndex?: number;
  spinDuration?: number;
  onSpinComplete?: () => void;
}

export default function SlotDrum({
  players,
  spinning,
  winnerIndex,
  onSpinComplete,
}: SlotDrumProps) {
  const winner = winnerIndex !== undefined ? players[winnerIndex] ?? null : null;

  // Pool: use wheelPlayers (real names) if large enough, else fall back to WHEEL_NAMES
  const pool = players.length > 10 ? players : WHEEL_NAMES;

  // ── Shared idle strip ──────────────────────────────────────────────────────
  // Computed once so strip state and lastVisibleNamesRef start from the same array.
  const idleStripRef = useRef<string[]>([]);
  if (idleStripRef.current.length === 0) {
    idleStripRef.current = buildIdleStrip(pool);
  }

  // ── State ──────────────────────────────────────────────────────────────────

  const [strip, setStrip] = useState<string[]>(() => idleStripRef.current);
  const [translateY, setTranslateY] = useState<number>(() => translateForIndex(CENTER));
  const [visibleCenter, setVisibleCenter] = useState<number>(CENTER);
  const [glowing, setGlowing] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────

  const rafRef = useRef<number | null>(null);
  const glowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Color offset persisted across spins. Each bar's hue = ((colorOffset + idx) % 20) * 18.
   * At spin end we save the offset so the lead-in of the next strip continues
   * the same color sequence without a jump.
   */
  const colorOffsetRef = useRef(0);

  /**
   * The VISIBLE names currently showing in the drum, top-to-bottom.
   * Initialized from the same idle strip as the state above.
   * Updated every RAF frame so the next spin always continues from exactly
   * what was visible when the drum stopped.
   */
  const lastVisibleNamesRef = useRef<string[]>(
    idleStripRef.current.slice(0, VISIBLE)
  );

  // ── Helpers ────────────────────────────────────────────────────────────────

  function cancelRaf() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
  }

  function updateVisibleNames(s: string[], centerIdx: number) {
    const from = centerIdx - CENTER;
    const names: string[] = [];
    for (let i = 0; i < VISIBLE; i++) {
      const si = from + i;
      names.push(si >= 0 && si < s.length ? s[si] : "");
    }
    lastVisibleNamesRef.current = names;
  }

  // ── Spin effect ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!spinning || !winner) {
      cancelRaf();
      return;
    }

    // Color offset: the new strip's index 0 is the old strip's (visibleCenter - CENTER).
    // Carry that forward so colors don't jump.
    colorOffsetRef.current = ((colorOffsetRef.current + visibleCenter - CENTER) % 20 + 20) % 20;

    const { strip: newStrip, winnerStripIndex } = buildSpinStrip(
      winner,
      pool,
      lastVisibleNamesRef.current
    );

    setStrip(newStrip);
    setGlowing(false);

    // Start exactly where the drum was — strip[CENTER] is centered, matching
    // the last visible state because leadIn seeds the strip top.
    const startY = translateForIndex(CENTER);
    const finalY = translateForIndex(winnerStripIndex);
    const totalDistance = startY - finalY;

    setTranslateY(startY);
    setVisibleCenter(CENTER);
    updateVisibleNames(newStrip, CENTER);

    const startTime = performance.now();

    const animate = (now: number) => {
      const t = Math.min((now - startTime) / SPIN_DURATION, 1);

      // Single smooth S-curve — no segments, no plateau
      const progress = easeInOutQuint(t);

      const currentY = startY - totalDistance * progress;
      const centerIdx = Math.round((startY - currentY) / STEP) + CENTER;
      const clampedCenter = Math.max(0, Math.min(centerIdx, newStrip.length - 1));

      setTranslateY(currentY);
      setVisibleCenter(clampedCenter);
      updateVisibleNames(newStrip, clampedCenter);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setTranslateY(finalY);
        setVisibleCenter(winnerStripIndex);
        updateVisibleNames(newStrip, winnerStripIndex);
        setGlowing(true);
        glowTimerRef.current = setTimeout(() => setGlowing(false), 1200);
        onSpinComplete?.();
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return cancelRaf;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, winner]);

  useEffect(() => () => cancelRaf(), []);

  // ── Render ─────────────────────────────────────────────────────────────────

  const drumHeight = VISIBLE * BAR_HEIGHT + (VISIBLE - 1) * BAR_GAP;
  const visibleFrom = Math.max(0, visibleCenter - CENTER - 1);
  const visibleTo   = Math.min(strip.length - 1, visibleCenter + CENTER + 1);

  return (
    <div
      style={{
        position: "relative",
        height: drumHeight,
        width: "22vw",
        minWidth: 280,
        maxWidth: 420,
        background: "#000",
        borderRadius: 24,
        boxShadow: "none",
        overflow: "hidden",
      }}
    >
      {/* Scrolling strip */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          transform: `translateY(${translateY}px)`,
        }}
      >
        {strip.map((name, idx) => {
          if (idx < visibleFrom || idx > visibleTo) return null;

          const offset = idx - visibleCenter;
          const absOffset = Math.abs(offset);
          const isCenter = offset === 0;
          const style = slotStyles[Math.min(absOffset, slotStyles.length - 1)];
          const color = `hsl(${((colorOffsetRef.current + idx) % 20) * 18}, 90%, 58%)`;

          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                top: idx * STEP,
                left: 0,
                right: 0,
                height: BAR_HEIGHT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: style.width,
                  height: "100%",
                  borderRadius: style.borderRadius,
                  backgroundColor: color,
                  opacity: style.opacity,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    isCenter && glowing
                      ? "0 0 0 3px rgba(255,255,255,0.95), 0 0 30px rgba(255,255,255,0.5), 0 0 60px rgba(255,215,0,0.55)"
                      : "none",
                  transition: "box-shadow 200ms ease",
                }}
              >
                {style.fontSize > 0 && (
                  <span
                    style={{
                      fontWeight: style.fontWeight,
                      fontSize: style.fontSize,
                      color: "#fff",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      padding: "0 12px",
                      userSelect: "none",
                    }}
                  >
                    {name}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Top fade */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: "22%",
          background: "linear-gradient(to bottom, #000 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 20,
        }}
      />

      {/* Bottom fade */}
      <div
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: "22%",
          background: "linear-gradient(to top, #000 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 20,
        }}
      />
    </div>
  );
}
