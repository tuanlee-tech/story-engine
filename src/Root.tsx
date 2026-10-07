import React from "react";
import { Composition, staticFile } from "remotion";
import { Story, type StoryProps } from "./Story";
import type { Timeline } from "./lib/types";

const EMPTY: Timeline = {
  fps: 30,
  width: 1080,
  height: 1920,
  durationInFrames: 30,
  subtitleStyle: "box",
  voice: null,
  voiceVolume: 1,
  bgm: null,
  bgmVolume: 0.12,
  scenes: [],
  sfx: [],
};

export const Root: React.FC = () => (
  <Composition
    id="Story"
    component={Story}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={30}
    defaultProps={{ timeline: EMPTY } satisfies StoryProps}
    calculateMetadata={async () => {
      const res = await fetch(staticFile("timeline.json"));
      if (!res.ok) throw new Error("Thiếu public/timeline.json — chạy: npm run timeline");
      const timeline = (await res.json()) as Timeline;
      return {
        durationInFrames: timeline.durationInFrames,
        fps: timeline.fps,
        width: timeline.width,
        height: timeline.height,
        props: { timeline },
      };
    }}
  />
);
