"use client";

import React from "react";

function shortName(player: string): string {
  const parts = player.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 12);
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function segmentColor(index: number, total: number): string {
  const hue = Math.round((360 / total) * (index + 1));
  return `hsl(${hue}, 82%, 50%)`;
}

export interface SpinningWheelProps {
  players: string[];
  targetRotation: number;
  spinning: boolean;
  spinDuration: number;
  size?: number;
}

export default function SpinningWheel({
  players,
  targetRotation,
  spinning,
  spinDuration,
  size = 500,
}: SpinningWheelProps) {
  const n = players.length;
  if (n === 0) return null;

  const radius = size / 2;
  const cssRotation = -90 + targetRotation;
  const easing = "cubic-bezier(0.440, -0.205, 0.000, 1.130)";
  const hubSize = Math.round(size * 0.16);
  const fontSize = Math.max(10, Math.round(size * 0.038));

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
      }}
    >
      {/* Pointer */}
      <div
        style={{
          position: "absolute",
          top: -18,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 30,
          pointerEvents: "none",
        }}
      >
        <svg width="36" height="52" viewBox="0 0 36 52" fill="none">
          <circle
            cx="18"
            cy="9"
            r="8"
            fill="#ef4444"
            stroke="#fff"
            strokeWidth="2.5"
          />
          <rect x="15" y="16" width="6" height="16" rx="3" fill="#ef4444" />
          <polygon
            points="4,30 32,30 18,52"
            fill="#ef4444"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Spinning disc */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          overflow: "hidden",
          transform: `rotate(${cssRotation}deg)`,
          transition: spinning
            ? `transform ${spinDuration}ms ${easing}`
            : "none",
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            display: "grid",
            placeContent: "center start",
            width: size,
            height: size,
          }}
        >
          {players.map((player, i) => {
            const segDeg = 360 / n;
            const segHeight = 2 * radius * Math.tan(Math.PI / n);

            return (
              <li
                key={`${player}-${i}`}
                style={{
                  gridArea: "1 / -1",
                  listStyle: "none",
                  width: radius,
                  height: segHeight,
                  clipPath: "polygon(0% -2%, 100% 50%, 0% 102%)",
                  transformOrigin: "center right",
                  rotate: `${segDeg * i}deg`,
                  background: segmentColor(i, n),
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: "0.6ch",
                  fontSize,
                  fontWeight: 700,
                  color: "#1a1a2e",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                {shortName(player)}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Gold ring */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          boxShadow: [
            "0 0 0 2px #f59e0b",
            "0 0 0 13px #f59e0b40",
            "0 0 40px rgba(245,158,11,0.25)",
            "inset 0 0 40px rgba(0,0,0,0.55)",
          ].join(", "),
          pointerEvents: "none",
          zIndex: 10,
        }}
      />

      {/* Center hub */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: hubSize,
          height: hubSize,
          borderRadius: "50%",
          background: "#05060f",
          border: "3px solid #f59e0b",
          boxShadow:
            "0 0 18px rgba(245,158,11,0.45), inset 0 0 12px rgba(0,0,0,0.7)",
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        {spinning ? (
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#facc15",
              animation: "ping 1s cubic-bezier(0,0,0.2,1) infinite",
            }}
          />
        ) : (
          <span
            style={{
              color: "#facc15",
              fontWeight: 800,
              fontSize: Math.max(8, Math.round(size * 0.022)),
              letterSpacing: "0.15em",
            }}
          >
            SPIN
          </span>
        )}
      </div>
    </div>
  );
}
