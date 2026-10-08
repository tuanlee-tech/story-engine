import React, { useMemo } from "react";
import { AbsoluteFill, OffthreadVideo, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/Cinzel";
import { loadFont as loadBodyFont } from "@remotion/google-fonts/Lora";
import type { Timeline, Word } from "../lib/types";

const { fontFamily: titleFont } = loadFont("normal", { weights: ["700", "800"], subsets: ["latin"] });
const { fontFamily: bodyFont } = loadBodyFont("normal", { weights: ["500", "600"], subsets: ["vietnamese", "latin"] });

const PRE = 0.05;

interface Props {
  timeline: Timeline;
}

/** 
 * Lấy ra danh sách các nhóm từ (mỗi nhóm khoảng 4 dòng)
 */
function buildLines(allWords: Word[]) {
  const chunks: Word[][] = [];
  let currentChunk: Word[] = [];
  let currentLineWords = 0;
  let linesInChunk = 0;

  // Simple heuristic for emphasis (Keyword)
  const isKeyword = (w: string) => {
    const clean = w.replace(/[.,!?]/g, "").toLowerCase();
    // Danh sách những từ triết lý mạnh hoặc từ dài
    const EMPHASIS = ["chiến", "thắng", "bản", "thân", "vĩ", "đại", "làm", "chủ", "nô", "lệ", "khốc", "liệt", "kẻ", "thù", "tư", "duy", "đập", "tan"];
    return EMPHASIS.includes(clean) || clean.length > 5;
  };

  for (let i = 0; i < allWords.length; i++) {
    const w = allWords[i];
    const em = isKeyword(w.w);
    
    // Đếm số từ để ngắt dòng
    if (em || currentLineWords >= 3) {
      linesInChunk++;
      currentLineWords = 0;
    } else {
      currentLineWords++;
    }

    currentChunk.push(w);

    // Dấu chấm câu ngắt chunk, hoặc đủ 4 dòng thì ngắt chunk (xóa trắng màn hình)
    const isEndOfSentence = /[.!?]$/.test(w.w);
    if (isEndOfSentence || linesInChunk >= 4) {
      chunks.push(currentChunk);
      currentChunk = [];
      linesInChunk = 0;
      currentLineWords = 0;
    }
  }
  if (currentChunk.length > 0) chunks.push(currentChunk);
  
  return chunks;
}

export const PhilosopherTemplate: React.FC<Props> = ({ timeline }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  // 1. Tượng Triết gia mặc định
  const philosopherImg = staticFile("philosopher.png"); // yêu cầu phải có file này

  // 2. Gom tất cả các từ trong timeline
  const allWords = useMemo(() => timeline.scenes.flatMap(s => s.chunks.flatMap(c => c.words)), [timeline]);
  const chunks = useMemo(() => buildLines(allWords), [allWords]);

  // Tìm chunk hiện tại đang hiển thị
  const activeChunkIndex = chunks.findIndex((chunk, i) => {
    const start = chunk[0].s - PRE;
    const nextStart = chunks[i + 1] ? chunks[i + 1][0].s - PRE : Infinity;
    return t >= start && t < nextStart;
  });

  const activeChunk = activeChunkIndex >= 0 ? chunks[activeChunkIndex] : null;

  return (
    <AbsoluteFill style={{ backgroundColor: "#050505" }}>
      {/* Layer 0: Background Animation (khói / bụi hạt / ánh sáng le lói) */}
      <AbsoluteFill style={{ opacity: 0.15, mixBlendMode: "screen" }}>
         {/* Có thể dùng một clip hạt bụi tĩnh. Ở đây dùng CSS gradient mờ */}
         <div style={{ width: "100%", height: "100%", background: "radial-gradient(circle at 70% 50%, #333 0%, transparent 60%)" }} />
      </AbsoluteFill>

      {/* Layer 1: Chủ thể bức tượng 40% bên trái */}
      <AbsoluteFill style={{ 
        width: "40%", left: 0, bottom: 0, 
        justifyContent: "flex-end", alignItems: "center" 
      }}>
        <Img src={philosopherImg} style={{ width: "90%", objectFit: "contain", filter: "contrast(1.1) brightness(0.9) grayscale(0.8)" }} />
      </AbsoluteFill>

      {/* Layer 2: Text 60% bên phải */}
      <AbsoluteFill style={{ 
        width: "55%", left: "40%", top: 0, height: "100%",
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        padding: "0 2rem"
      }}>
        {activeChunk && (
          <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "12px 20px" }}>
            {activeChunk.map((w, i) => {
              // Word có đang active không (đã tới mốc tg)
              if (t < w.s) return <span key={i} style={{ opacity: 0 }} />;
              
              const clean = w.w.replace(/[.,!?]/g, "").toLowerCase();
              const EMPHASIS = ["chiến", "thắng", "bản", "thân", "vĩ", "đại", "làm", "chủ", "nô", "lệ", "khốc", "liệt", "kẻ", "thù", "tư", "duy", "đập", "tan"];
              const isEm = EMPHASIS.includes(clean) || clean.length > 5;

              const pop = spring({ frame: frame - Math.round(w.s * fps), fps, config: { damping: 12, stiffness: 200 } });
              const scale = interpolate(pop, [0, 1], [0.8, 1]);
              const opacity = interpolate(pop, [0, 1], [0, 1]);

              // Nếu là từ nhấn mạnh -> bẻ dòng (flexBasis 100%) và font lớn
              return (
                <span 
                  key={i} 
                  style={{
                    display: "inline-block",
                    opacity,
                    transform: `scale(${scale})`,
                    flexBasis: isEm ? "100%" : "auto",
                    textAlign: "center",
                    fontFamily: isEm ? titleFont : bodyFont,
                    fontSize: isEm ? "5.5rem" : "2.5rem",
                    fontWeight: isEm ? 800 : 500,
                    textTransform: isEm ? "uppercase" : "none",
                    color: isEm ? "#fff" : "#ccc",
                    textShadow: "0 4px 12px rgba(0,0,0,0.8)",
                    lineHeight: 1.1
                  }}
                >
                  {w.w}
                </span>
              );
            })}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
