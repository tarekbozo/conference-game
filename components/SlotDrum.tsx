"use client";

import { useEffect, useRef, useState } from "react";

const VISIBLE = 15;
const CENTER = Math.floor(VISIBLE / 2);

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
  const orderRef = useRef<number[]>([...Array(n)].map((_, i) => i));

  function shuffleOrder() {
    const arr = [...Array(n)].map((_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    orderRef.current = arr;
  }

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
      shuffleOrder();

      const winnerIndex =
        finalName && players.indexOf(finalName) >= 0
          ? players.indexOf(finalName)
          : Math.floor(Math.random() * n);

      const totalTicks = 45 + winnerIndex;
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
          delay = Math.max(55, delay - 18);
        } else if (tick > totalTicks - 16) {
          delay += 24;
        }

        if (tick < totalTicks) {
          timeoutRef.current = setTimeout(animate, delay);
        } else {
          setIsAnimating(false);
          setGlowing(true);
          glowTimerRef.current = setTimeout(() => setGlowing(false), 800);
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
          glowTimerRef.current = setTimeout(() => setGlowing(false), 800);
        }
      }
    }
  }, [spinning, finalName, n]);

  useEffect(() => () => clearTimers(), []);

  if (n === 0) return null;

  // Per-slot style based on distance from center
  const slotStyles = [
    {
      height: 64,
      width: "100%",
      fontSize: 20,
      fontWeight: 800,
      opacity: 1,
      borderRadius: 14,
    },
    {
      height: 56,
      width: "92%",
      fontSize: 16,
      fontWeight: 700,
      opacity: 0.88,
      borderRadius: 16,
    },
    {
      height: 46,
      width: "85%",
      fontSize: 14,
      fontWeight: 600,
      opacity: 0.65,
      borderRadius: 20,
    },
    {
      height: 36,
      width: "75%",
      fontSize: 12,
      fontWeight: 500,
      opacity: 0.4,
      borderRadius: 24,
    },
    {
      height: 26,
      width: "65%",
      fontSize: 10,
      fontWeight: 400,
      opacity: 0.2,
      borderRadius: 28,
    },
    {
      height: 16,
      width: "50%",
      fontSize: 8,
      fontWeight: 300,
      opacity: 0.1,
      borderRadius: 32,
    },
    {
      height: 10,
      width: "40%",
      fontSize: 6,
      fontWeight: 200,
      opacity: 0.06,
      borderRadius: 36,
    },
    {
      height: 6,
      width: "30%",
      fontSize: 4,
      fontWeight: 100,
      opacity: 0.03,
      borderRadius: 40,
    },
    {
      height: 4,
      width: "20%",
      fontSize: 2,
      fontWeight: 100,
      opacity: 0.015,
      borderRadius: 44,
    },
    {
      height: 2,
      width: "10%",
      fontSize: 1,
      fontWeight: 100,
      opacity: 0.008,
      borderRadius: 48,
    },
  ];

  const bars = Array.from({ length: VISIBLE }, (_, i) => {
    const offset = i - CENTER;
    const absOffset = Math.abs(offset);
    const playerIdx = (((centerIndex + offset) % n) + n) % n;
    const displayIdx = orderRef.current[playerIdx];
    const color = `hsl(${(displayIdx / n) * 360}, 90%, 58%)`;
    const isCenter = offset === 0;
    const style = slotStyles[Math.min(absOffset, slotStyles.length - 1)];
    return { i, name: players[displayIdx], isCenter, color, style };
  });

  return (
    <div
      style={{
        position: "relative",
        height: "60vh",
        width: "22vw",
        minWidth: 280,
        maxWidth: 380,
        background: "#000",
        borderRadius: 24,
        border: "1.5px solid #222",
        boxShadow: "0 0 40px rgba(161,0,255,0.15)",
        overflow: "hidden",
      }}
    >
      {/* Bars — centered in the container */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          padding: "0 14px",
          boxSizing: "border-box",
        }}
      >
        {bars.map(({ i, name, isCenter, color, style }) => (
          <div
            key={i}
            style={{
              width: style.width,
              height: style.height,
              borderRadius: style.borderRadius,
              backgroundColor: color,
              opacity: style.opacity,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              filter: isAnimating && !isCenter ? "blur(0.3px)" : "none",
              boxShadow:
                isCenter && glowing
                  ? "0 0 0 3px rgba(255,255,255,0.95), 0 0 30px rgba(255,255,255,0.5), 0 0 60px rgba(255,215,0,0.55)"
                  : "none",
              transition:
                "width 60ms ease, height 60ms ease, opacity 60ms ease, border-radius 60ms ease",
            }}
          >
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
          </div>
        ))}
      </div>

      {/* Top fade */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "28%",
          background: "linear-gradient(to bottom, #000 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 20,
        }}
      />

      {/* Bottom fade */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "28%",
          background: "linear-gradient(to top, #000 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 20,
        }}
      />
    </div>
  );
}
