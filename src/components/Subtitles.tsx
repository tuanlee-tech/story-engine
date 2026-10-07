import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/BeVietnamPro";
import type { Chunk, SubtitleStyle } from "../lib/types";

const { fontFamily } = loadFont("normal", {
  weights: ["700", "800"],
  subsets: ["vietnamese", "latin", "latin-ext"],
});

const PRE = 0.04; // hiện sớm hơn từ đầu tiên một chút
const HOLD = 0.3; // giữ lại sau từ cuối nếu chưa có dòng kế

/** Tìm chunk cuối có s - PRE <= t (chunks đã sắp theo thời gian). */
function findChunk(chunks: Chunk[], t: number): number {
  let lo = 0;
  let hi = chunks.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (chunks[mid].s - PRE <= t) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans;
}

/** Viền chữ bằng text-shadow (ổn định trên mọi bản Chromium). */
const outline = (px: number, color: string): string => {
  const out: string[] = [];
  for (let a = 0; a < 360; a += 30) {
    const r = (a * Math.PI) / 180;
    out.push(`${(Math.cos(r) * px).toFixed(1)}px ${(Math.sin(r) * px).toFixed(1)}px 0 ${color}`);
  }
  out.push(`0 ${px * 1.2}px ${px * 2.5}px rgba(0,0,0,0.55)`);
  return out.join(",");
};

interface Props {
  chunks: Chunk[];
  style: SubtitleStyle;
}

export const Subtitles: React.FC<Props> = ({ chunks, style }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  const idx = findChunk(chunks, t);
  if (idx < 0) return null;
  const chunk = chunks[idx];
  const next = chunks[idx + 1];
  const hideAt = Math.min(chunk.e + HOLD, next ? next.s - PRE : Infinity);
  if (t > hideAt) return null;

  let active = -1;
  for (let i = 0; i < chunk.words.length; i++) if (chunk.words[i].s <= t) active = i;

  const vertical = height > width;
  const isBox = style === "box";
  const fontSize = Math.round(width * (vertical ? (isBox ? 0.064 : 0.056) : isBox ? 0.034 : 0.03));
  const bottom = Math.round(height * (vertical ? 0.15 : 0.085));

  const enter = interpolate(frame - Math.round((chunk.s - PRE) * fps), [0, 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom,
        display: "flex",
        justifyContent: "center",
        padding: `0 ${Math.round(width * 0.06)}px`,
        fontFamily,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          textAlign: "center",
          fontSize,
          lineHeight: 1.28,
          fontWeight: isBox ? 800 : 700,
          textTransform: isBox ? "uppercase" : "none",
          letterSpacing: isBox ? "0.01em" : 0,
          opacity: enter,
          transform: `translateY(${(1 - enter) * 14}px)`,
          ...(isBox
            ? { color: "#fff", textShadow: outline(Math.max(3, fontSize * 0.07), "#0a0a0a") }
            : {
                color: "#fff",
                background: "rgba(8,10,16,0.66)",
                borderRadius: fontSize * 0.5,
                padding: `${fontSize * 0.28}px ${fontSize * 0.7}px`,
              }),
        }}
      >
        {chunk.words.map((w, i) => {
          const isActive = i === active;
          const pop = isActive
            ? spring({ frame: frame - Math.round(w.s * fps), fps, config: { damping: 13, stiffness: 240, mass: 0.6 } })
            : 1;
          const scale = isActive ? interpolate(pop, [0, 1], [0.86, 1]) : 1;
          return (
            <span key={i}>
              <span
                style={{
                  display: "inline-block",
                  padding: `0 ${fontSize * 0.16}px`,
                  borderRadius: fontSize * 0.22,
                  transform: `scale(${scale})`,
                  ...(isBox
                    ? { background: isActive ? "#FF7A1A" : "transparent" }
                    : { color: isActive ? "#FFD400" : "#fff" }),
                }}
              >
                {w.w}
              </span>{" "}
            </span>
          );
        })}
      </div>
    </div>
  );
};
