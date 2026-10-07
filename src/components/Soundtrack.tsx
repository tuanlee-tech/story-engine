import React from "react";
import { Html5Audio, Sequence, interpolate, staticFile, useVideoConfig } from "remotion";
import type { Timeline } from "../lib/types";

export const Soundtrack: React.FC<{ timeline: Timeline }> = ({ timeline }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = Math.round(fps * 1.0);
  const fadeOut = Math.round(fps * 2.5);

  const bgmVolume = (f: number) =>
    timeline.bgmVolume *
    interpolate(f, [0, fadeIn, durationInFrames - fadeOut, durationInFrames - 1], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  return (
    <>
      {timeline.voice && <Html5Audio src={staticFile(timeline.voice)} volume={timeline.voiceVolume} />}
      {timeline.bgm && <Html5Audio src={staticFile(timeline.bgm)} loop volume={bgmVolume} />}
      {timeline.sfx.map((c, i) => (
        <Sequence key={i} from={Math.round(c.at * fps)} layout="none">
          <Html5Audio src={staticFile(c.file)} volume={c.volume} />
        </Sequence>
      ))}
    </>
  );
};
