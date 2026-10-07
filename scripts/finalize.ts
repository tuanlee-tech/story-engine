/**
 * Chuẩn hóa loudness 2 lượt (EBU R128) về -14 LUFS / -1.5 dBTP, giữ nguyên video (copy), faststart.
 * Dùng: tsx scripts/finalize.ts out/raw.mp4 out/final.mp4 [-14]
 */
import { spawnSync } from "node:child_process";

const [src, dst, target] = process.argv.slice(2);
if (!src || !dst) {
  console.error("Dùng: tsx scripts/finalize.ts <vào.mp4> <ra.mp4> [LUFS=-14]");
  process.exit(1);
}
const I = Number(target ?? -14);
const TP = -1.5;
const LRA = 11;
const base = `loudnorm=I=${I}:TP=${TP}:LRA=${LRA}`;

const pass1 = spawnSync(
  "ffmpeg",
  ["-hide_banner", "-nostats", "-i", src, "-vn", "-af", `${base}:print_format=json`, "-f", "null", "-"],
  { encoding: "utf8" },
);
if (pass1.status !== 0) {
  console.error(pass1.stderr);
  process.exit(1);
}
const err = pass1.stderr;
const m = JSON.parse(err.slice(err.lastIndexOf("{"), err.lastIndexOf("}") + 1));
console.log(`Lượt 1: ${m.input_i} LUFS, TP ${m.input_tp} dB, LRA ${m.input_lra} LU`);

const af = `${base}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
const pass2 = spawnSync(
  "ffmpeg",
  ["-hide_banner", "-y", "-i", src, "-map", "0:v", "-map", "0:a", "-c:v", "copy", "-af", af, "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", dst],
  { stdio: "inherit" },
);
if (pass2.status !== 0) process.exit(pass2.status ?? 1);
console.log(`\n✓ ${dst}  (≈ ${I} LUFS)`);
