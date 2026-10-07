/**
 * input/voice.srt + input/sentences.txt + public/images/* (+ overrides.json, project.json)
 *   → public/timeline.json
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { alignSentences, flattenCues } from "../src/lib/align";
import { parseSrt } from "../src/lib/srt";
import { chunkWords, tokenize } from "../src/lib/text";
import {
  CAMERAS,
  DEFAULT_CONFIG,
  SFX_KINDS,
  TRANSITIONS,
  type Camera,
  type ProjectConfig,
  type Scene,
  type SceneOverride,
  type SfxCue,
  type Timeline,
  type Transition,
} from "../src/lib/types";

const ROOT = process.cwd();
const IN = (f: string) => path.join(ROOT, "input", f);
const PUB = (f: string) => path.join(ROOT, "public", f);

const warnings: string[] = [];
const warn = (m: string) => warnings.push(m);
const fail = (m: string): never => {
  console.error(`\n✗ ${m}\n`);
  process.exit(1);
};

const MEDIA_EXT = /\.(png|jpe?g|webp|mp4|webm|mov)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov)$/i;
const MIN_SCENE = 0.5;
const RISER_LEN = 1.5;
const CAMERA_CYCLE: Camera[] = ["push-in", "pan-right", "pull-out", "pan-left", "drift-up", "push-in"];

// ---------- cấu hình ----------
const cfgPath = IN("project.json");
const config: ProjectConfig = {
  ...DEFAULT_CONFIG,
  ...(fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, "utf8")) : {}),
};
const [width, height] = config.format === "vertical" ? [1080, 1920] : [1920, 1080];

// ---------- đầu vào ----------
if (!fs.existsSync(IN("voice.srt"))) fail("Thiếu input/voice.srt");
if (!fs.existsSync(IN("sentences.txt"))) fail("Thiếu input/sentences.txt (chạy: npm run scenes input/scenes.md)");

const sentences = fs
  .readFileSync(IN("sentences.txt"), "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean);
const cues = parseSrt(fs.readFileSync(IN("voice.srt"), "utf8"));
if (!cues.length) fail("Không đọc được cue nào trong input/voice.srt");

// ---------- media: ảnh/video theo số thứ tự đầu tên file ----------
const imgDir = PUB("images");
const files = fs.existsSync(imgDir) ? fs.readdirSync(imgDir).filter((f) => MEDIA_EXT.test(f)) : [];
if (!files.length) fail("public/images trống.");
const numbered = files.map((f) => ({ f, n: Number(f.match(/^(\d+)/)?.[1] ?? NaN) }));
const byNumber = numbered.every((x) => !Number.isNaN(x.n)) && new Set(numbered.map((x) => x.n)).size === numbered.length;

let mediaFor: (sceneNo: number) => string | undefined;
if (byNumber) {
  const map = new Map(numbered.map((x) => [x.n, x.f]));
  mediaFor = (n) => map.get(n);
} else {
  warn("Tên file không đều số thứ tự đầu tên (001_..., 002_...) → ghép theo thứ tự sắp xếp tên.");
  const sorted = [...files].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  mediaFor = (n) => sorted[n - 1];
}
const missing = sentences.map((_, i) => i + 1).filter((n) => !mediaFor(n));
if (missing.length) {
  fail(`Thiếu ảnh/video cho cảnh: ${missing.slice(0, 15).join(", ")}${missing.length > 15 ? "…" : ""} (có ${files.length} file / ${sentences.length} câu).`);
}
if (files.length > sentences.length) warn(`Có ${files.length} file media nhưng chỉ ${sentences.length} câu — file dư bị bỏ qua.`);

// ---------- căn thời gian ----------
const aligned = alignSentences(sentences, flattenCues(cues), warn);

let voiceDur = 0;
if (config.voice && fs.existsSync(PUB(config.voice))) {
  try {
    voiceDur = Number(
      execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", PUB(config.voice)], {
        encoding: "utf8",
      }).trim(),
    );
  } catch {
    warn("Không chạy được ffprobe — dùng mốc cuối của SRT làm độ dài giọng.");
  }
} else if (config.voice) {
  warn(`Chưa thấy public/${config.voice} — video sẽ không có giọng.`);
}
const lastWordEnd = aligned[aligned.length - 1].e;
const totalSeconds = Math.max(voiceDur, lastWordEnd) + config.tail;

// ---------- overrides ----------
const ovPath = IN("overrides.json");
const overrides: Record<string, SceneOverride> = fs.existsSync(ovPath) ? JSON.parse(fs.readFileSync(ovPath, "utf8")) : {};
for (const [k, v] of Object.entries(overrides)) {
  if (v.camera && !CAMERAS.includes(v.camera)) fail(`overrides[${k}].camera không hợp lệ: ${v.camera}`);
  if (v.transition && !TRANSITIONS.includes(v.transition)) fail(`overrides[${k}].transition không hợp lệ: ${v.transition}`);
  if (v.sfx && !SFX_KINDS.includes(v.sfx)) fail(`overrides[${k}].sfx không hợp lệ: ${v.sfx}`);
}

// ---------- dựng cảnh ----------
const starts: number[] = [];
aligned.forEach((a, i) => {
  const wanted = i === 0 ? 0 : Math.max(0, a.s - config.lead);
  const s = i === 0 ? 0 : Math.max(wanted, starts[i - 1] + MIN_SCENE);
  if (s > a.s + 0.3) warn(`Cảnh ${i + 1} (${(a.e - a.s).toFixed(2)}s) quá ngắn — hình có thể trễ so với giọng ~${(s - a.s).toFixed(1)}s.`);
  starts.push(s);
});

let prevCamera: Camera | null = null;
const scenes: Scene[] = aligned.map((a, i) => {
  const no = i + 1;
  const media = mediaFor(no)!;
  const kind = VIDEO_EXT.test(media) ? "video" : "image";
  const prevText = i > 0 ? aligned[i - 1].text.trim() : "";
  const wordCount = tokenize(a.text).length;

  let transition: Transition = "dissolve";
  if (i === 0) transition = "cut";
  else if (prevText.endsWith("?") || wordCount <= 3) transition = "whoosh";

  const ov = overrides[String(no)] ?? {};
  let camera: Camera = kind === "video" ? "static" : i === 0 ? "push-in" : CAMERA_CYCLE[i % CAMERA_CYCLE.length];
  // không lặp lại đúng chuyển động của cảnh trước (kể cả khi cảnh trước bị override)
  for (let k = 1; kind === "image" && camera === prevCamera && k <= CAMERA_CYCLE.length; k++) {
    camera = CAMERA_CYCLE[(i + k) % CAMERA_CYCLE.length];
  }
  camera = ov.camera ?? camera;
  prevCamera = camera;

  return {
    id: no,
    media: `images/${media}`,
    kind,
    start: starts[i],
    end: i + 1 < aligned.length ? starts[i + 1] : totalSeconds,
    text: a.text,
    chunks: chunkWords(a.words, config.maxWordsPerChunk),
    camera,
    transition: i === 0 ? "cut" : ov.transition ?? transition,
  };
});

// ---------- SFX tự động ----------
const sfx: SfxCue[] = [];
let lastRiser = -99;
scenes.forEach((sc, i) => {
  if (i === 0) return;
  const ov = overrides[String(sc.id)]?.sfx ?? "auto";
  if (ov === "none") return;
  const kind = ov !== "auto" ? ov : sc.transition === "whoosh" ? "swoosh" : sc.transition === "flash" ? "hit" : "none";
  if (kind === "none") return;

  if (kind === "swoosh") sfx.push({ file: "sfx/swoosh.wav", at: Math.max(0, sc.start - 0.12), volume: 0.55 });
  if (kind === "hit") sfx.push({ file: "sfx/hit.wav", at: sc.start, volume: 0.7 });
  if (kind === "riser") sfx.push({ file: "sfx/riser.wav", at: Math.max(0, sc.start - RISER_LEN), volume: 0.4 });

  const prevLen = scenes[i - 1].end - scenes[i - 1].start;
  if (ov === "auto" && kind === "swoosh" && i - lastRiser >= 8 && prevLen >= RISER_LEN + 0.2) {
    sfx.push({ file: "sfx/riser.wav", at: Math.max(0, sc.start - RISER_LEN), volume: 0.4 });
    lastRiser = i;
  }
});
for (const f of new Set(sfx.map((s) => s.file))) {
  if (!fs.existsSync(PUB(f))) warn(`Thiếu public/${f} — chạy: npm run sfx`);
}
if (config.bgm && !fs.existsSync(PUB(config.bgm))) warn(`Chưa thấy public/${config.bgm} — video sẽ không có nhạc nền.`);

// ---------- ghi timeline ----------
const timeline: Timeline = {
  fps: config.fps,
  width,
  height,
  durationInFrames: Math.ceil(totalSeconds * config.fps),
  subtitleStyle: config.subtitleStyle,
  voice: config.voice && fs.existsSync(PUB(config.voice)) ? config.voice : null,
  voiceVolume: config.voiceVolume,
  bgm: config.bgm && fs.existsSync(PUB(config.bgm)) ? config.bgm : null,
  bgmVolume: config.bgmVolume,
  scenes,
  sfx: sfx.sort((a, b) => a.at - b.at),
};
fs.writeFileSync(PUB("timeline.json"), JSON.stringify(timeline));

const count = <T extends string>(xs: T[]) => xs.reduce<Record<string, number>>((m, x) => ((m[x] = (m[x] ?? 0) + 1), m), {});
const mm = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
console.log(`\n✓ public/timeline.json — ${scenes.length} cảnh · ${mm(totalSeconds)} · ${width}x${height}@${config.fps}`);
console.log(`  TB ${(totalSeconds / scenes.length).toFixed(2)}s/cảnh · camera`, count(scenes.map((s) => s.camera)));
console.log(`  chuyển cảnh`, count(scenes.map((s) => s.transition)), `· SFX ${sfx.length}`);
if (warnings.length) {
  console.log(`\n⚠ ${warnings.length} cảnh báo:`);
  warnings.slice(0, 30).forEach((w) => console.log("  - " + w));
  if (warnings.length > 30) console.log(`  … và ${warnings.length - 30} cảnh báo nữa`);
}
console.log();
