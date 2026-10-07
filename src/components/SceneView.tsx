import React from "react";
import { AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { Camera, Scene } from "../lib/types";

/** s = scale, x/y = dịch chuyển theo % kích thước khung. Biên an toàn: scale ≥ 1.1 cho phép dịch ±5%. */
const CAMERA: Record<Camera, { s: [number, number]; x: [number, number]; y: [number, number] }> = {
  "push-in": { s: [1.0, 1.15], x: [0, 0], y: [0, -1] },
  "pull-out": { s: [1.17, 1.02], x: [0, 0], y: [-1, 0] },
  "pan-left": { s: [1.15, 1.15], x: [3.5, -3.5], y: [0, 0] },
  "pan-right": { s: [1.15, 1.15], x: [-3.5, 3.5], y: [0, 0] },
  "drift-up": { s: [1.1, 1.17], x: [0, 1], y: [3, -3] },
  static: { s: [1, 1], x: [0, 0], y: [0, 0] },
};

const lerp = (a: [number, number], p: number) => a[0] + (a[1] - a[0]) * p;
const easeOut = Easing.out(Easing.cubic);

interface Props {
  scene: Scene;
  /** Tổng số frame cảnh tồn tại (đã gồm phần gối sang cảnh sau). */
  durationInFrames: number;
  /** Số frame hiệu ứng vào cảnh. */
  enterFrames: number;
}

export const SceneView: React.FC<Props> = ({ scene, durationInFrames, enterFrames }) => {
  const frame = useCurrentFrame();

  // --- camera (Ken Burns) ---
  const cam = CAMERA[scene.camera];
  const p = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 1], {
    easing: Easing.linear,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const camTransform = `translate(${lerp(cam.x, p)}%, ${lerp(cam.y, p)}%) scale(${lerp(cam.s, p)})`;

  // --- hiệu ứng vào cảnh ---
  const t = enterFrames > 0 ? Math.min(1, frame / enterFrames) : 1;
  let opacity = 1;
  let blur = 0;
  let shiftX = 0;
  let flash = 0;

  if (scene.transition === "dissolve") {
    opacity = easeOut(t);
  } else if (scene.transition === "whoosh") {
    opacity = interpolate(t, [0, 0.45], [0, 1], { extrapolateRight: "clamp" });
    blur = (1 - t) * (1 - t) * 24;
    shiftX = (1 - easeOut(t)) * 8;
  } else if (scene.transition === "flash") {
    flash = interpolate(t, [0, 0.2, 1], [0, 0.9, 0]);
  }

  const media: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };

  return (
    <AbsoluteFill
      style={{
        opacity,
        filter: blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : undefined,
        transform: shiftX > 0.01 ? `translateX(${shiftX.toFixed(2)}%) scale(1.16)` : undefined,
      }}
    >
      <AbsoluteFill style={{ transform: camTransform, willChange: "transform" }}>
        {scene.kind === "video" ? (
          // Clip Flow ~8s: dài hơn 1 cảnh (~3s) nên không cần loop.
          <OffthreadVideo src={staticFile(scene.media)} muted style={media} />
        ) : (
          <Img src={staticFile(scene.media)} style={media} />
        )}
      </AbsoluteFill>
      {flash > 0.001 && <AbsoluteFill style={{ background: "#fff", opacity: flash }} />}
    </AbsoluteFill>
  );
};
