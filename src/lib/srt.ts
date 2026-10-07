export interface Cue {
  start: number;
  end: number;
  text: string;
}

const TS = /(\d+):(\d{2}):(\d{2})[,.](\d{1,3})/;

const toSeconds = (m: RegExpMatchArray): number =>
  Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4].padEnd(3, "0")) / 1000;

export function parseSrt(raw: string): Cue[] {
  const blocks = raw.replace(/^\uFEFF/, "").replace(/\r/g, "").split(/\n{2,}/);
  const cues: Cue[] = [];
  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const idx = lines.findIndex((l) => l.includes("-->"));
    if (idx === -1) continue;
    const [a, b] = lines[idx].split("-->");
    const ma = a.match(TS);
    const mb = b.match(TS);
    if (!ma || !mb) continue;
    const text = lines
      .slice(idx + 1)
      .join(" ")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    cues.push({ start: toSeconds(ma), end: toSeconds(mb), text });
  }
  return cues.sort((x, y) => x.start - y.start);
}
