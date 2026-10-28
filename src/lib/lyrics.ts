import type { Song } from "@/lib/playlist";

export type LyricLine = { start: number; end: number; text: string };

const TIMING = /(\d+):(\d{2}):(\d{2})[,.](\d{1,3})\s*-->\s*(\d+):(\d{2}):(\d{2})[,.](\d{1,3})/;

function seconds(h: string, m: string, s: string, ms: string): number {
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms.padEnd(3, "0")) / 1000;
}

/** Parses SRT (or WebVTT) cues; ♪ markers and line breaks inside a cue are dropped. */
export function parseSrt(text: string): LyricLine[] {
  return text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n\s*\r?\n/)
    .flatMap((block) => {
      const lines = block.trim().split(/\r?\n/);
      const at = lines.findIndex((line) => TIMING.test(line));
      if (at < 0) return [];
      const [, h1, m1, s1, ms1, h2, m2, s2, ms2] = lines[at].match(TIMING)!;
      const body = lines
        .slice(at + 1)
        .join(" ")
        .replace(/♪/g, "")
        .replace(/\s+/g, " ")
        .trim();
      return body ? [{ start: seconds(h1, m1, s1, ms1), end: seconds(h2, m2, s2, ms2), text: body }] : [];
    })
    .sort((a, b) => a.start - b.start);
}

export async function loadLyrics(song: Song): Promise<LyricLine[]> {
  try {
    const response = await fetch(song.lyricsUrl, { cache: "no-store" });
    // The dev server answers missing files with index.html.
    if (!response.ok || (response.headers.get("content-type") ?? "").includes("html")) return [];
    return parseSrt(await response.text());
  } catch {
    return [];
  }
}

/** Index of the last line that has started by `time`, or -1 before the first line. */
export function lineAt(lines: LyricLine[], time: number): number {
  let found = -1;
  for (let i = 0; i < lines.length && lines[i].start <= time; i++) found = i;
  return found;
}
