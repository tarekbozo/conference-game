"use client";

import { useEffect, useRef, useState } from "react";

const VISIBLE = 15;
const CENTER = Math.floor(VISIBLE / 2);

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
  finalName,
  winnerIndex,
  onSpinComplete,
}: SlotDrumProps) {
  const n = players.length;
  const [centerIndex, setCenterIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const rafRef = useRef<number | null>(null);
  const glowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollPosRef = useRef<number>(0);
  const targetPosRef = useRef<number>(0);
  const frameRef = useRef<number>(0);

  function cancelRaf() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
  }

  useEffect(() => {
    if (n === 0) return;

    if (spinning) {
      setGlowing(false);
      cancelRaf();
      setIsAnimating(true);

      const resolvedWinnerIndex =
        winnerIndex !== undefined && winnerIndex >= 0 ? winnerIndex : 0;

      const totalFrames = 500;
      const MAX_SPEED = 0.1;

      // Total slots the sine curve will travel
      const totalSlots = Math.ceil(totalFrames * MAX_SPEED * (2 / Math.PI));

      // Calculate target so drum lands EXACTLY on winner after totalSlots
      const currentPos = scrollPosRef.current;
      const currentMod = ((Math.round(currentPos) % n) + n) % n;
      const distToWinner = (((resolvedWinnerIndex - currentMod) % n) + n) % n;

      // How many full rotations fit in totalSlots
      const minRotations = 3;
      const fullRotations = Math.max(
        minRotations,
        Math.floor((totalSlots - distToWinner) / n),
      );
      targetPosRef.current = currentPos + fullRotations * n + distToWinner;

      let frame = 0;

      const animateFrame = () => {
        frame++;
        const progress = frame / totalFrames;
        const speed = Math.sin(progress * Math.PI) * MAX_SPEED;

        scrollPosRef.current += Math.max(speed, 0);
        setCenterIndex(((Math.round(scrollPosRef.current) % n) + n) % n);

        if (frame < totalFrames) {
          rafRef.current = requestAnimationFrame(animateFrame);
        } else {
          scrollPosRef.current = targetPosRef.current;
          setCenterIndex(((Math.round(targetPosRef.current) % n) + n) % n);
          setIsAnimating(false);
          setGlowing(true);
          glowTimerRef.current = setTimeout(() => setGlowing(false), 800);
          onSpinComplete?.();
        }
      };

      rafRef.current = requestAnimationFrame(animateFrame);
      return cancelRaf;
    } else {
      cancelRaf();
      setIsAnimating(false);
      // RAF completion handler already placed the drum on the correct slot and triggered glow
    }
  }, [spinning, winnerIndex, n]);

  useEffect(() => () => cancelRaf(), []);

  if (n === 0) return null;

  const maxBarVh = Math.floor(82 / VISIBLE);

  const slotStyles = [
    {
      flexGrow: 5,
      width: "100%",
      fontSize: 20,
      fontWeight: 800,
      opacity: 1,
      borderRadius: 14,
    },
    {
      flexGrow: 4.2,
      width: "92%",
      fontSize: 16,
      fontWeight: 700,
      opacity: 0.88,
      borderRadius: 16,
    },
    {
      flexGrow: 3.4,
      width: "84%",
      fontSize: 13,
      fontWeight: 600,
      opacity: 0.65,
      borderRadius: 20,
    },
    {
      flexGrow: 2.6,
      width: "74%",
      fontSize: 11,
      fontWeight: 500,
      opacity: 0.42,
      borderRadius: 24,
    },
    {
      flexGrow: 1.9,
      width: "63%",
      fontSize: 9,
      fontWeight: 400,
      opacity: 0.25,
      borderRadius: 28,
    },
    {
      flexGrow: 1.3,
      width: "52%",
      fontSize: 7,
      fontWeight: 300,
      opacity: 0.14,
      borderRadius: 32,
    },
    {
      flexGrow: 0.8,
      width: "40%",
      fontSize: 0,
      fontWeight: 200,
      opacity: 0.08,
      borderRadius: 36,
    },
    {
      flexGrow: 0.4,
      width: "28%",
      fontSize: 0,
      fontWeight: 100,
      opacity: 0.04,
      borderRadius: 40,
    },
  ];

  const bars = Array.from({ length: VISIBLE }, (_, i) => {
    const offset = i - CENTER;
    const absOffset = Math.abs(offset);
    const playerIdx = (((centerIndex + offset) % n) + n) % n;
    const color = `hsl(${(playerIdx / n) * 360}, 90%, 58%)`;
    const isCenter = offset === 0;
    const style = slotStyles[Math.min(absOffset, slotStyles.length - 1)];
    return { i, name: players[playerIdx], isCenter, color, style };
  });

  return (
    <div
      style={{
        position: "relative",
        height: "75vh",
        width: "22vw",
        minWidth: 280,
        maxWidth: 420,
        background: "#000",
        borderRadius: 24,
        border: "1.5px solid #222",
        boxShadow: "0 0 40px rgba(161,0,255,0.15)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "6px 14px",
          gap: 4,
          boxSizing: "border-box",
        }}
      >
        {bars.map(({ i, name, isCenter, color, style }) => (
          <div
            key={i}
            style={{
              flexGrow: style.flexGrow,
              flexShrink: 1,
              flexBasis: 0,
              minHeight: 0,
              maxHeight: `${maxBarVh}vh`,
              width: style.width,
              borderRadius: style.borderRadius,
              backgroundColor: color,
              opacity: style.opacity,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              filter: isAnimating && !isCenter ? "blur(0.3px)" : "none",
              boxShadow:
                isCenter && glowing
                  ? "0 0 0 3px rgba(255,255,255,0.95), 0 0 30px rgba(255,255,255,0.5), 0 0 60px rgba(255,215,0,0.55)"
                  : "none",
              transition:
                "width 60ms ease, opacity 60ms ease, border-radius 60ms ease",
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
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "20%",
          background: "linear-gradient(to bottom, #000 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 20,
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "20%",
          background: "linear-gradient(to top, #000 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 20,
        }}
      />
    </div>
  );
}
