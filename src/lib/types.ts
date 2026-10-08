export type Camera = "push-in" | "pull-out" | "pan-left" | "pan-right" | "drift-up" | "static";
export type Transition = "dissolve" | "whoosh" | "flash" | "cut";
export type SfxKind = string;
export type SubtitleStyle = "box" | "yellow";

export const CAMERAS: Camera[] = ["push-in", "pull-out", "pan-left", "pan-right", "drift-up", "static"];
export const TRANSITIONS: Transition[] = ["dissolve", "whoosh", "flash", "cut"];
export const SFX_KINDS: string[] = ["auto", "none", "swoosh", "riser", "hit"]; // This is now just default suggestions

/** Thời gian tính bằng giây, tuyệt đối trên timeline. */
export interface Word {
  w: string;
  s: number;
  e: number;
}

export interface Chunk {
  s: number;
  e: number;
  words: Word[];
}

export interface Scene {
  id: number;
  media: string; // đường dẫn tương đối trong /public
  kind: "image" | "video";
  start: number;
  end: number;
  text: string;
  chunks: Chunk[];
  camera: Camera;
  transition: Transition;
}

export interface SfxCue {
  file: string; // tương đối trong /public
  at: number;
  volume: number;
}

export interface Timeline {
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  subtitleStyle: SubtitleStyle;
  template?: "philosopher" | "default";
  voice: string | null;
  voiceVolume: number;
  bgm: string | null;
  bgmVolume: number;
  scenes: Scene[];
  sfx: SfxCue[];
}

export interface SceneOverride {
  camera?: Camera;
  transition?: Transition;
  sfx?: SfxKind;
}

export interface ProjectConfig {
  fps: number;
  format: "vertical" | "horizontal";
  subtitleStyle: SubtitleStyle;
  template?: "philosopher" | "default";
  voice: string | null;
  bgm: string | null;
  voiceVolume: number;
  bgmVolume: number;
  /** Hình đổi trước giọng bao nhiêu giây (J-cut) cho cảm giác tự nhiên. */
  lead: number;
  /** Giữ cảnh cuối sau khi hết giọng. */
  tail: number;
  /** Số từ tối đa trên 1 dòng phụ đề. */
  maxWordsPerChunk: number;
}

export const DEFAULT_CONFIG: ProjectConfig = {
  fps: 30,
  format: "vertical",
  subtitleStyle: "box",
  voice: "audio/voice.mp3",
  bgm: "audio/bgm.mp3",
  voiceVolume: 1,
  bgmVolume: 0.12,
  lead: 0.1,
  tail: 1.2,
  maxWordsPerChunk: 6,
};

/** Thời lượng hiệu ứng vào cảnh (giây). */
export const TRANSITION_SECONDS: Record<Transition, number> = {
  dissolve: 0.35,
  whoosh: 0.28,
  flash: 0.22,
  cut: 0,
};
