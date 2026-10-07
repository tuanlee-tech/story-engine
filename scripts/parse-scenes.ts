/**
 * input/scenes.md (do AI Agent sinh) →
 *   input/sentences.txt   mỗi dòng 1 câu thoại (đưa cho TTS + build-timeline)
 *   input/prompts.txt     mỗi dòng 1 prompt ảnh (dán/batch vào Google Flow)
 *   input/prompts.json    [{id, prompt}] cho tự động hóa
 *   input/overrides.json  CAMERA / TRANSITION / SFX do agent chỉ định
 */
import fs from "node:fs";
import path from "node:path";
import { CAMERAS, SFX_KINDS, TRANSITIONS, type SceneOverride } from "../src/lib/types";
import { tokenize } from "../src/lib/text";

const src = process.argv[2] ?? "input/scenes.md";
if (!fs.existsSync(src)) {
  console.error(`✗ Không thấy ${src}`);
  process.exit(1);
}

interface Raw {
  id: number;
  NARRATION: string;
  PROMPT: string;
  CAMERA?: string;
  TRANSITION?: string;
  SFX?: string;
}

const HEAD = /^##\s*(?:scene|cảnh)?\s*0*(\d+)\b/i;
const FIELD = /^(NARRATION|PROMPT|CAMERA|TRANSITION|SFX)\s*:\s*(.*)$/i;

const scenes: Raw[] = [];
let cur: Raw | null = null;
let key: keyof Raw | null = null;

for (const line of fs.readFileSync(src, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/)) {
  const h = line.match(HEAD);
  if (h) {
    cur = { id: Number(h[1]), NARRATION: "", PROMPT: "" };
    scenes.push(cur);
    key = null;
    continue;
  }
  if (/^##\s/.test(line)) {
    // tiêu đề `## ...` khác (vd: ## AUDIO) — không thuộc cảnh nào
    cur = null;
    key = null;
    continue;
  }
  if (!cur) continue;
  const f = line.match(FIELD);
  if (f) {
    key = f[1].toUpperCase() as keyof Raw;
    (cur as unknown as Record<string, string>)[key] = f[2].trim();
  } else if (key && line.trim() && !line.startsWith("#")) {
    (cur as unknown as Record<string, string>)[key] += " " + line.trim();
  }
}

const errors: string[] = [];
const notes: string[] = [];
if (!scenes.length) errors.push("Không tìm thấy cảnh nào (cần các tiêu đề dạng `## 001`).");

scenes.forEach((s, i) => {
  if (s.id !== i + 1) errors.push(`Cảnh thứ ${i + 1} đang đánh số ${s.id} — phải liên tục 1..N.`);
  if (!s.NARRATION) errors.push(`Cảnh ${s.id}: thiếu NARRATION.`);
  if (!s.PROMPT) errors.push(`Cảnh ${s.id}: thiếu PROMPT.`);
  if (s.CAMERA && !CAMERAS.includes(s.CAMERA as never)) errors.push(`Cảnh ${s.id}: CAMERA "${s.CAMERA}" không hợp lệ (${CAMERAS.join("|")}).`);
  if (s.TRANSITION && !TRANSITIONS.includes(s.TRANSITION as never)) errors.push(`Cảnh ${s.id}: TRANSITION "${s.TRANSITION}" không hợp lệ (${TRANSITIONS.join("|")}).`);
  // Any SFX string is allowed now
  const n = tokenize(s.NARRATION).length;
  if (n > 18) notes.push(`Cảnh ${s.id}: câu dài ${n} chữ — nên tách để mỗi cảnh ≈ 2–4 giây.`);
  if (n > 0 && n < 2) notes.push(`Cảnh ${s.id}: câu 1 chữ — chỉ nên dùng cho nhịp nhấn.`);
});

if (errors.length) {
  console.error(`\n✗ ${errors.length} lỗi trong ${src}:`);
  errors.slice(0, 40).forEach((e) => console.error("  - " + e));
  process.exit(1);
}

const dir = path.dirname(src);
const out = (f: string, c: string) => fs.writeFileSync(path.join(dir, f), c);

out("sentences.txt", scenes.map((s) => s.NARRATION).join("\n") + "\n");
out("prompts.txt", scenes.map((s) => s.PROMPT).join("\n") + "\n");
out(
  "prompts.json",
  JSON.stringify(scenes.map((s) => ({ id: s.id, file: String(s.id).padStart(3, "0"), prompt: s.PROMPT })), null, 2),
);

const overrides: Record<string, SceneOverride> = {};
for (const s of scenes) {
  const o: SceneOverride = {};
  if (s.CAMERA && s.CAMERA !== "auto") o.camera = s.CAMERA as SceneOverride["camera"];
  if (s.TRANSITION && s.TRANSITION !== "auto") o.transition = s.TRANSITION as SceneOverride["transition"];
  if (s.SFX && s.SFX !== "auto") o.sfx = s.SFX as SceneOverride["sfx"];
  if (Object.keys(o).length) overrides[String(s.id)] = o;
}
out("overrides.json", JSON.stringify(overrides, null, 2));

const words = scenes.reduce((a, s) => a + tokenize(s.NARRATION).length, 0);
const est = words / 3.8;
console.log(`\n✓ ${scenes.length} cảnh · ${words} chữ · ước tính ≈ ${Math.floor(est / 60)}:${String(Math.round(est % 60)).padStart(2, "0")} (≈3.8 chữ/giây)`);
console.log(`  → ${dir}/sentences.txt · prompts.txt · prompts.json · overrides.json (${Object.keys(overrides).length} cảnh có chỉ định riêng)`);
if (notes.length) {
  console.log(`\n⚠ ${notes.length} lưu ý:`);
  notes.slice(0, 20).forEach((n) => console.log("  - " + n));
}
console.log(`\nLưu ảnh Flow vào public/images/ đặt tên 001.png, 002.png … (hoặc 001_xxx.jpg) khớp số cảnh.\n`);
