import React, { useMemo } from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { SceneView } from "./components/SceneView";
import { Soundtrack } from "./components/Soundtrack";
import { Subtitles } from "./components/Subtitles";
import { PhilosopherTemplate } from "./components/PhilosopherTemplate";
import { TRANSITION_SECONDS, type Timeline } from "./lib/types";

export type StoryProps = { timeline: Timeline };

export const Story: React.FC<StoryProps> = ({ timeline }) => {
  const { fps, scenes, durationInFrames } = timeline;

  const layout = useMemo(
    () =>
      scenes.map((scene, i) => {
        const from = Math.round(scene.start * fps);
        const next = scenes[i + 1];
        const end = next ? Math.round(next.start * fps) : durationInFrames;
        // cảnh trước kéo dài thêm đúng phần hiệu ứng vào của cảnh sau để hòa tan/chuyển cảnh mượt
        const overlap = next ? Math.round(TRANSITION_SECONDS[next.transition] * fps) : 0;
        return {
          scene,
          from,
          duration: Math.max(1, end - from) + overlap,
          enter: Math.round(TRANSITION_SECONDS[scene.transition] * fps),
        };
      }),
    [scenes, fps, durationInFrames],
  );

  const chunks = useMemo(() => scenes.flatMap((s) => s.chunks), [scenes]);

  if (timeline.template === "philosopher") {
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        <PhilosopherTemplate timeline={timeline} />
        <Soundtrack timeline={timeline} />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {layout.map(({ scene, from, duration, enter }) => (
        <Sequence key={scene.id} from={from} durationInFrames={duration} premountFor={fps}>
          <SceneView scene={scene} durationInFrames={duration} enterFrames={enter} />
        </Sequence>
      ))}
      <Subtitles chunks={chunks} style={timeline.subtitleStyle} />
      <Soundtrack timeline={timeline} />
    </AbsoluteFill>
  );
};
