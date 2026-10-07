import type { Cue } from "./srt";
import { keyOf, tokenize } from "./text";
import type { Word } from "./types";

export interface StreamWord {
  raw: string;
  key: string;
  s: number;
  e: number;
}

export interface AlignedSentence {
  text: string;
  words: Word[];
  s: number;
  e: number;
}

/** Trải các cue SRT thành luồng từ; thời gian từng từ chia theo độ dài ký tự trong cue. */
export function flattenCues(cues: Cue[]): StreamWord[] {
  const out: StreamWord[] = [];
  for (const cue of cues) {
    const toks = tokenize(cue.text);
    if (!toks.length) continue;
    const weights = toks.map((t) => keyOf(t).length + 1);
    const total = weights.reduce((a, b) => a + b, 0);
    const dur = Math.max(cue.end - cue.start, 0.05);
    let t = cue.start;
    toks.forEach((tok, i) => {
      const d = (dur * weights[i]) / total;
      out.push({ raw: tok, key: keyOf(tok), s: t, e: t + d });
      t += d;
    });
  }
  return out;
}

const OFFSETS = [0, 1, -1, 2, -2, 3, -3, 4, 5, 6, 7, 8];

function findStart(stream: StreamWord[], keys: string[], ptr: number): number {
  for (const strict of [true, false]) {
    for (const o of OFFSETS) {
      const j = ptr + o;
      if (j < 0 || j >= stream.length || stream[j].key !== keys[0]) continue;
      if (!strict || keys.length < 2 || stream[j + 1]?.key === keys[1]) return j;
    }
  }
  return -1;
}

function spreadByLength(tokens: string[], s: number, e: number): Word[] {
  const weights = tokens.map((t) => keyOf(t).length + 1);
  const total = weights.reduce((a, b) => a + b, 0);
  let t = s;
  return tokens.map((w, i) => {
    const d = ((e - s) * weights[i]) / total;
    const word = { w, s: t, e: t + d };
    t += d;
    return word;
  });
}

/**
 * Khớp từng câu trong kịch bản (sentences.txt) với luồng từ của SRT theo thứ tự.
 * Chữ hiển thị lấy từ kịch bản (đúng chính tả), thời gian lấy từ SRT.
 * Có tự đồng bộ lại khi ASR sai/lệch vài từ.
 */
export function alignSentences(
  sentences: string[],
  stream: StreamWord[],
  warn: (msg: string) => void,
): AlignedSentence[] {
  const result: AlignedSentence[] = [];
  let ptr = 0;

  sentences.forEach((text, i) => {
    const toks = tokenize(text);
    if (!toks.length) throw new Error(`Câu ${i + 1} không có chữ nào.`);
    if (ptr >= stream.length) {
      throw new Error(`SRT hết trước câu ${i + 1}: "${text}". Kịch bản dài hơn giọng đọc/SRT.`);
    }
    const keys = toks.map(keyOf);

    if (stream[ptr].key !== keys[0]) {
      const j = findStart(stream, keys, ptr);
      if (j >= 0) {
        if (j !== ptr) warn(`Câu ${i + 1}: đồng bộ lại điểm bắt đầu (${j - ptr >= 0 ? "+" : ""}${j - ptr} từ).`);
        ptr = j;
      } else {
        warn(`Câu ${i + 1}: không thấy "${toks[0]}" gần vị trí SRT hiện tại — giữ theo thứ tự.`);
      }
    }

    let endIdx = Math.min(ptr + toks.length - 1, stream.length - 1);
    const lastKey = keys[keys.length - 1];
    if (stream[endIdx].key !== lastKey) {
      let best = -1;
      for (let d = 1; d <= 5 && best < 0; d++) {
        for (const j of [endIdx + d, endIdx - d]) {
          if (j >= ptr && j < stream.length && stream[j].key === lastKey) {
            best = j;
            break;
          }
        }
      }
      if (best >= 0) endIdx = best;
      else warn(`Câu ${i + 1}: từ cuối "${toks[toks.length - 1]}" lệch giữa kịch bản và SRT.`);
    }

    const slice = stream.slice(ptr, endIdx + 1);
    const words: Word[] =
      slice.length === toks.length
        ? toks.map((w, k) => ({ w, s: slice[k].s, e: slice[k].e }))
        : spreadByLength(toks, slice[0].s, slice[slice.length - 1].e);

    result.push({ text, words, s: slice[0].s, e: slice[slice.length - 1].e });
    ptr = endIdx + 1;
  });

  const left = stream.length - ptr;
  if (left > 0 && left <= 5 && result.length) {
    result[result.length - 1].e = stream[stream.length - 1].e;
  } else if (left > 5) {
    warn(`SRT còn dư ${left} từ sau câu cuối — kịch bản có thiếu câu không?`);
  }
  return result;
}
