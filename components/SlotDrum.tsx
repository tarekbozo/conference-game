"use client";

import { useEffect, useRef, useState } from "react";

const VISIBLE = 9;
const CENTER = Math.floor(VISIBLE / 2); // index 4 is the selected slot

export interface SlotDrumProps {
  players: string[];
  spinning: boolean;
  finalName: string | null;
  onSpinComplete?: () => void;
}

export default function SlotDrum({
  players,
  spinning,
  finalName,
  onSpinComplete,
}: SlotDrumProps) {
  const n = players.length;
  const [centerIndex, setCenterIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const glowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimers() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
  }

  useEffect(() => {
    if (n === 0) return;

    if (spinning) {
      setGlowing(false);
      clearTimers();
      setIsAnimating(true);

      // finalName is always null when spinning starts — the store resolves the winner
      // only after SPIN_DURATION + SPIN_BUFFER. Use a placeholder so the math works;
      // the real name snaps in when spinning becomes false.
      const winnerIndex =
        finalName && players.indexOf(finalName) >= 0
          ? players.indexOf(finalName)
          : Math.floor(Math.random() * n);

      const totalTicks = 45 + winnerIndex;

      // Solve: (startIndex + totalTicks) % n === winnerIndex
      const startIndex = (((winnerIndex - (totalTicks % n)) % n) + n) % n;

      let delay = 200;
      let tick = 0;
      let cur = startIndex;
      setCenterIndex(startIndex);

      const animate = () => {
        tick++;
        cur = (cur + 1) % n;
        setCenterIndex(cur);

        if (tick < 10) {
          delay = Math.max(55, delay - 18); // speed up
        } else if (tick > totalTicks - 16) {
          delay += 24; // slow down
        }

        if (tick < totalTicks) {
          timeoutRef.current = setTimeout(animate, delay);
        } else {
          setIsAnimating(false);
          setGlowing(true);
          glowTimerRef.current = setTimeout(() => setGlowing(false), 600);
          onSpinComplete?.();
        }
      };

      timeoutRef.current = setTimeout(animate, delay);
      return clearTimers;
    } else {
      clearTimers();
      setIsAnimating(false);

      if (finalName) {
        const idx = players.indexOf(finalName);
        if (idx >= 0) {
          setCenterIndex(idx);
          setGlowing(true);
          glowTimerRef.current = setTimeout(() => setGlowing(false), 600);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, finalName, n]);

  useEffect(() => () => clearTimers(), []);

  if (n === 0) return null;

  const bars = Array.from({ length: VISIBLE }, (_, i) => {
    const offset = i - CENTER; // −4 to +4
    const playerIdx = (((centerIndex + offset) % n) + n) % n;
    const color = `hsl(${(playerIdx / n) * 360}, 90%, 60%)`;
    return { i, playerIdx, name: players[playerIdx], offset, color };
  });

  return (
    <div
      className="relative overflow-hidden bg-black rounded-2xl flex flex-col items-center"
      style={{
        height: "60vh",
        width: "22vw",
        minWidth: 280,
        maxWidth: 380,
        border: "1.5px solid #2a2a2a",
        boxShadow: "0 0 40px rgba(161,0,255,0.18), 0 0 0 1px #111",
      }}
    >
      {/* Center selector window — white border highlight */}

      {/* Bar strip */}
      <div className="flex flex-col items-center justify-center gap-3 w-full h-full px-3">
        {bars.map(({ i, name, offset, color }) => {
          const absOffset = Math.abs(offset);
          const isCenter = offset === 0;

          const scale = isCenter ? 1.05 : absOffset >= 4 ? 0.9 : 1;
          const opacity = absOffset >= 4 ? 0.5 : 1;
          const filter = isAnimating ? "blur(0.5px)" : "none";
          const boxShadow =
            isCenter && glowing
              ? "0 0 0 3px rgba(255,255,255,0.9), 0 0 24px rgba(255,255,255,0.6), 0 0 56px rgba(255,215,0,0.65)"
              : "none";

          return (
            <div
              key={i}
              className="w-full rounded-2xl flex items-center justify-center shrink-0"
              style={{
                height: "8vh",
                minHeight: 52,
                backgroundColor: color,
                transform: `scale(${scale})`,
                opacity,
                filter,
                boxShadow,
                transition: "transform 75ms, opacity 75ms",
              }}
            >
              <span
                className="font-bold text-black truncate px-4 select-none"
                style={{ fontSize: "2vh" }}
              >
                {name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Top gradient fade */}
      <div className="absolute inset-x-0 top-0 h-[35%] bg-gradient-to-b from-black to-transparent pointer-events-none z-20" />
      {/* Bottom gradient fade */}
      <div className="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-black to-transparent pointer-events-none z-20" />
    </div>
  );
}
