import type { Chunk, Word } from "./types";

/** Khóa so khớp: chữ thường, bỏ dấu câu, giữ nguyên dấu tiếng Việt. */
export const keyOf = (token: string): string =>
  token
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");

export const tokenize = (text: string): string[] =>
  text
    .normalize("NFC")
    .trim()
    .split(/\s+/)
    .filter((t) => keyOf(t).length > 0);

const BREAK_AFTER = /[,.;:?!…—–]$/;

/**
 * Chia các từ của 1 câu thành các dòng phụ đề ngắn:
 * ưu tiên ngắt ở dấu câu, mỗi dòng ≤ maxWords, tránh dòng mồ côi 1 từ.
 */
export function chunkWords(words: Word[], maxWords: number): Chunk[] {
  if (words.length === 0) return [];
  const groups: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    if (BREAK_AFTER.test(w.w) && cur.length >= 2) {
      groups.push(cur);
      cur = [];
    }
  }
  if (cur.length) groups.push(cur);

  const split: Word[][] = [];
  for (const g of groups) {
    if (g.length <= maxWords) {
      split.push(g);
      continue;
    }
    const parts = Math.ceil(g.length / maxWords);
    const size = Math.ceil(g.length / parts);
    for (let i = 0; i < g.length; i += size) split.push(g.slice(i, i + size));
  }

  const merged: Word[][] = [];
  for (const g of split) {
    const prev = merged[merged.length - 1];
    if (g.length === 1 && prev && prev.length + 1 <= maxWords + 1) prev.push(g[0]);
    else if (prev && prev.length === 1 && prev.length + g.length <= maxWords + 1) prev.push(...g);
    else merged.push([...g]);
  }

  return merged.map((g) => ({ s: g[0].s, e: g[g.length - 1].e, words: g }));
}
