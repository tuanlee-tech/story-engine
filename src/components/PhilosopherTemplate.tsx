import React, { useMemo } from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate, Solid } from "remotion";
import { loadFont } from "@remotion/google-fonts/Cinzel";
import { lightLeak } from "@remotion/effects/light-leak";
import { paper } from "@remotion/effects/paper";
import { grayscale } from "@remotion/effects/grayscale";
import { Highlight } from "@remotion/rough-notation";
import type { Timeline, Word } from "../lib/types";

const { fontFamily: titleFont } = loadFont("normal", { weights: ["700", "800"], subsets: ["latin"] });

const PRE = 0.05;
const COLORS = ["#d4af37", "#b22222", "#D6703B", "#aaaaaa"]; // Gold, Blood Red, Rust Orange, Silver

interface Props {
  timeline: Timeline;
}

interface WordGroup {
  isEm: boolean;
  words: Word[];
  start: number;
  end: number;
}

const EMPHASIS_WORDS = [
  "chiến", "thắng", "bản", "thân", "vĩ", "đại",
  "làm", "chủ", "nô", "lệ", "khốc", "liệt",
  "kẻ", "thù", "tư", "duy", "đập", "tan"
];

function isKeyword(w: string) {
  const clean = w.replace(/[.,!?]/g, "").toLowerCase();
  return EMPHASIS_WORDS.includes(clean) || clean.length >= 6;
}

function buildLines(allWords: Word[]) {
  const chunks: Word[][] = [];
  let currentChunk: Word[] = [];
  let currentLineWords = 0;
  let linesInChunk = 0;

  for (let i = 0; i < allWords.length; i++) {
    const w = allWords[i];
    const em = isKeyword(w.w);
    
    if (em || currentLineWords >= 3) {
      linesInChunk++;
      currentLineWords = 0;
    } else {
      currentLineWords++;
    }

    currentChunk.push(w);

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

/**
 * Gom các từ trong chunk thành từng cụm:
 * Các từ nhấn mạnh liền kề nhau sẽ dính thành 1 cụm (vd: "CHIẾN THẮNG", "VĨ ĐẠI", "LÀM CHỦ")
 */
function groupChunkWords(words: Word[]): WordGroup[] {
  const groups: WordGroup[] = [];
  let currentGroup: WordGroup | null = null;

  for (const w of words) {
    const em = isKeyword(w.w);

    if (!currentGroup) {
      currentGroup = { isEm: em, words: [w], start: w.s, end: w.e };
    } else if (currentGroup.isEm === em && em && currentGroup.words.length < 2) {
      // Gom tối đa 2 từ nhấn mạnh trên mỗi dòng để tránh tràn viền
      currentGroup.words.push(w);
      currentGroup.end = Math.max(currentGroup.end, w.e);
    } else {
      groups.push(currentGroup);
      currentGroup = { isEm: em, words: [w], start: w.s, end: w.e };
    }
  }
  if (currentGroup) groups.push(currentGroup);
  return groups;
}

export const PhilosopherTemplate: React.FC<Props> = ({ timeline }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  const philosopherImg = staticFile(timeline.templateOptions?.philosopher?.image || "philosopher.png");

  const allWords = useMemo(() => timeline.scenes.flatMap(s => s.chunks.flatMap(c => c.words)), [timeline]);
  const chunks = useMemo(() => buildLines(allWords), [allWords]);

  const activeChunkIndex = chunks.findIndex((chunk, i) => {
    const start = chunk[0].s - PRE;
    const nextStart = chunks[i + 1] ? chunks[i + 1][0].s - PRE : Infinity;
    return t >= start && t < nextStart;
  });

  const activeChunk = activeChunkIndex >= 0 ? chunks[activeChunkIndex] : null;
  const groups = useMemo(() => activeChunk ? groupChunkWords(activeChunk) : [], [activeChunk]);

  // 1. Light Leak: Reveals during first half, retracts during second half
  const leakCycle = 210; // mỗi ~7 giây lặp 1 chu kỳ
  const leakDuration = 75; // mỗi đợt quét kéo dài 2.5 giây
  const leakFrame = frame % leakCycle;
  const isLeaking = leakFrame < leakDuration;
  const leakProgress = isLeaking ? leakFrame / leakDuration : 0;

  // 2. Chuyển động vào cho tượng chậm rãi (Cinematic Entrance)
  // zoom/shiftX đọc từ templateOptions để tự điều chỉnh theo từng ảnh tượng
  // (self-check: python3 scripts/check-overflow.py)
  const [zoomStart, zoomEnd] = timeline.templateOptions?.philosopher?.zoom ?? [0.92, 1.0];
  const [txFrom, txTo] = timeline.templateOptions?.philosopher?.shiftX ?? [-60, -20];
  const statueEntrance = spring({
    frame,
    fps,
    config: { damping: 30, stiffness: 18, mass: 1.8 },
  });
  const statueTranslateX = interpolate(statueEntrance, [0, 1], [txFrom, txTo]);
  const statueOpacity = interpolate(statueEntrance, [0, 1], [0, 1]);

  // 3. Chuyển động zoom/drift chậm rãi xuyên suốt toàn bộ video (Ken Burns)
  // Fit-to-height: contain + scale <= 1.0 để không tràn sang nửa chữ, không cụt đầu
  // (kiểm tra bằng: python3 scripts/check-overflow.py public/<anh>.png)
  const totalFrames = timeline.durationInFrames || 600;
  const statueScale = interpolate(frame, [0, totalFrames], [zoomStart, zoomEnd]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Layer 0: Background với Paper texture & Light Leak trắng/xám opacity 0.5 */}
      <AbsoluteFill>
        {/* Nền giấy cổ đen sẫm */}
        <Solid
          width={width}
          height={height}
          color="#000000"
          effects={[
            paper({
              amount: 0.35,
              roughness: 0.45,
              contrast: 0.35,
              crumples: 0.2,
              folds: 0.25,
              colorFront: "#1c1a17",
              colorBack: "#000000",
            }),
          ]}
        />
        {/* Light Leaks màu sáng trắng / xám, opacity 0.5 (loại bỏ màu nóng) */}
        <AbsoluteFill style={{ opacity: 0.5, mixBlendMode: "screen" }}>
          <Solid
            width={width}
            height={height}
            color="#000000"
            effects={[
              lightLeak({
                progress: leakProgress,
                seed: Math.floor(frame / leakCycle) * 7 + 11,
                disabled: !isLeaking,
              }),
              grayscale({ amount: 1 }), // Biến các màu nóng thành dải trắng/xám sáng
            ]}
          />
        </AbsoluteFill>
        {/* Hạt bụi thời gian (Grunge texture lướt nhẹ chậm rãi, rất mờ) */}
        <div style={{
          position: "absolute", width: "200%", height: "200%",
          backgroundImage: `url(${staticFile("grunge.jpg")})`,
          backgroundSize: "800px",
          opacity: 0.04,
          mixBlendMode: "screen",
          transform: `translate(${- (frame % 2000) * 0.1}px, ${- (frame % 2000) * 0.05}px)`
        }} />
      </AbsoluteFill>

      {/* Layer 1: Chủ thể bức tượng với chuyển động vào chậm rãi & drift */}
      <AbsoluteFill
        style={{
          width: "50%",
          left: 0,
          bottom: "0%",
          justifyContent: "flex-end",
          alignItems: "flex-start",
          scale: statueScale,
          translate: `${statueTranslateX}px 0px`,
          opacity: statueOpacity,
        }}
      >
        <Img
          src={philosopherImg}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "left bottom",
            filter: "contrast(1.15) brightness(0.85) grayscale(0.5)"
          }}
        />
      </AbsoluteFill>

      {/* Layer 2: Text 50% bên phải */}
      <AbsoluteFill
        style={{
          width: "50%",
          left: "45%",
          top: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "0 2.5rem",
          scale: 1.028,
          translate: "10px -15.1px",
          lineHeight: 2,
          textAlign: "center"
        }}
      >
        {activeChunk && (
          <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "20px 25px", width: "100%", overflow: "visible" }}>
            {groups.map((group, gIdx) => {
              if (t < group.start) return <span key={gIdx} style={{ opacity: 0 }} />;

              const groupText = group.words.map(w => w.w).join(" ");
              const colorHighlight = COLORS[groupText.length % COLORS.length];

              // Trường hợp 1: Cụm từ nhấn mạnh (Highlight dính liền theo cụm)
              if (group.isEm) {
                const hlFrame = frame - Math.round(group.start * fps);
                const hlProgress = interpolate(hlFrame, [0, 14], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });

                return (
                  <Highlight
                    key={gIdx}
                    progress={hlProgress}
                    color={colorHighlight ? `${colorHighlight}35` : "rgba(212, 175, 55, 0.25)"}
                    padding={{ top: 6, bottom: 6, left: 14, right: 14 }}
                    iterations={1}
                    style={{
                      display: "inline-block",
                      flexBasis: "100%",
                      textAlign: "center",
                      margin: "6px 0",
                      overflow: "visible",
                      maxWidth: "100%",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        flexWrap: "nowrap",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "0.25em",
                        fontFamily: titleFont,
                        fontSize: group.words.length > 1 ? "5.4rem" : "6.5rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        lineHeight: 1.25,
                        paddingTop: "0.18em",
                        paddingBottom: "0.1em",
                        maxWidth: "100%",
                        overflow: "visible",
                      }}
                    >
                      {group.words.map((w, wIdx) => {
                        const isWordActive = t >= w.s;
                        const wordPop = spring({
                          frame: frame - Math.round(w.s * fps),
                          fps,
                          config: { damping: 12, stiffness: 200 },
                        });
                        const wordScale = interpolate(wordPop, [0, 1], [0.85, 1]);
                        return (
                          <span
                            key={wIdx}
                            style={{
                              display: "inline-block",
                              opacity: isWordActive ? 1 : 0,
                              transform: `scale(${wordScale})`,
                              backgroundImage: `url(${staticFile("grunge.jpg")})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              color: colorHighlight || "#ffffff",
                              filter: "brightness(1.2) drop-shadow(0 6px 16px rgba(0,0,0,0.9))",
                            }}
                          >
                            {w.w}
                          </span>
                        );
                      })}
                    </span>
                  </Highlight>
                );
              }

              // Trường hợp 2: Các từ bình thường (rải từng từ)
              return group.words.map((w, wIdx) => {
                if (t < w.s) return <span key={wIdx} style={{ opacity: 0 }} />;
                const pop = spring({
                  frame: frame - Math.round(w.s * fps),
                  fps,
                  config: { damping: 12, stiffness: 200 },
                });
                const scale = interpolate(pop, [0, 1], [0.8, 1]);

                return (
                  <span
                    key={`${gIdx}-${wIdx}`}
                    style={{
                      display: "inline-block",
                      opacity: 1,
                      transform: `scale(${scale})`,
                      fontFamily: titleFont,
                      fontSize: "3.8rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: "#e0dcc7",
                      backgroundImage: `url(${staticFile("grunge.jpg")})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      filter: "brightness(0.8) drop-shadow(0 6px 16px rgba(0,0,0,0.9))",
                      lineHeight: 1.3,
                      paddingTop: "0.2em",
                      paddingBottom: "0.1em",
                      overflow: "visible",
                    }}
                  >
                    {w.w}
                  </span>
                );
              });
            })}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
