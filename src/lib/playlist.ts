export type SongKind = "song" | "dance" | "guest" | "chorus" | "blank" | "rules" | "link" | "opening" | "ending";

export type Song = {
  index: number;
  /** As written in the 顺序 column, e.g. "3", "D1", "B". */
  code: string;
  /** Display form of `code`: contestant numbers are zero-padded. */
  label: string;
  kind: SongKind;
  singer: string;
  title: string;
  link: string;
  videoId: string | null;
  start: number;
  backupUrl: string;
  /** Optional timed lyrics, public/lyrics/<label>.srt */
  lyricsUrl: string;
};

const BASE = import.meta.env.BASE_URL;
const UNTITLED = "曲目待定 · TBD";

const KIND_BY_PREFIX: Record<string, SongKind> = {
  "": "song",
  B: "blank",
  R: "rules",
  D: "dance",
  G: "guest",
  C: "chorus",
  L: "link",
  V: "link",
  O: "opening",
  E: "ending",
};

export const KIND_NAMES: Record<SongKind, { zh: string; en: string }> = {
  song: { zh: "歌手", en: "Singer" },
  dance: { zh: "舞蹈", en: "Dance" },
  guest: { zh: "嘉宾表演", en: "Guest performance" },
  chorus: { zh: "大合唱", en: "Sing-along" },
  blank: { zh: "表演", en: "Performance" },
  rules: { zh: "比赛规则", en: "Rules" },
  link: { zh: "互动环节", en: "Interactive" },
  opening: { zh: "开场", en: "Opening" },
  ending: { zh: "闭幕", en: "Closing" },
};

const MEDIA_KINDS = new Set<SongKind>(["song", "dance", "guest", "chorus"]);

export function isMedia(song: Song): boolean {
  return MEDIA_KINDS.has(song.kind);
}

export function normalizeCode(code: string): string {
  const upper = code.trim().toUpperCase();
  return /^\d+$/.test(upper) ? String(Number.parseInt(upper, 10)) : upper;
}

export async function loadPlaylist(): Promise<Song[]> {
  const response = await fetch(`${BASE}list.csv`, { cache: "no-store" });
  if (!response.ok) throw new Error(`list.csv: HTTP ${response.status}`);
  return parsePlaylist(await response.text());
}

export function parsePlaylist(text: string): Song[] {
  const rows = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .slice(1);

  const songs = rows.flatMap((line) => {
    const [rawCode, name, rawTitle, rawLink] = line.split(",").map((part) => part.trim());
    if (!rawCode) return [];
    const code = rawCode.toUpperCase();
    const contestant = /^\d+$/.test(code);
    const kind = KIND_BY_PREFIX[code.replace(/\d+$/, "")] ?? "song";
    const rawSinger = name || (contestant ? "" : KIND_NAMES[kind].zh);
    if (!rawSinger) return [];
    const label = contestant ? code.padStart(2, "0") : code;
    const link = rawLink ?? "";
    const { videoId, start } = MEDIA_KINDS.has(kind) ? parseYouTube(link) : { videoId: null, start: 0 };
    const fileName = `${label}_${rawSinger}${rawTitle ? `_${rawTitle}` : ""}.mp3`;
    return [
      {
        code,
        label,
        kind,
        singer: rawSinger,
        title: rawTitle || (contestant ? UNTITLED : ""),
        link,
        videoId,
        start,
        backupUrl: `${BASE}backup-audio/${encodeURIComponent(fileName)}`,
        lyricsUrl: `${BASE}lyrics/${encodeURIComponent(label)}.srt`,
      },
    ];
  });
  return songs.map((song, index) => ({ ...song, index }));
}

export function parseYouTube(link: string): { videoId: string | null; start: number } {
  try {
    const url = new URL(link);
    const videoId = url.hostname.endsWith("youtu.be") ? url.pathname.slice(1) : url.searchParams.get("v");
    return { videoId: videoId || null, start: parseStart(url.searchParams.get("t") ?? url.searchParams.get("start")) };
  } catch {
    return { videoId: null, start: 0 };
  }
}

function parseStart(value: string | null): number {
  if (!value) return 0;
  if (/^\d+s?$/.test(value)) return Number.parseInt(value, 10);
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match) return 0;
  const [, h = "0", m = "0", s = "0"] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

export async function hasBackup(song: Song): Promise<boolean> {
  try {
    const response = await fetch(song.backupUrl, { method: "HEAD" });
    return response.ok && (response.headers.get("content-type") ?? "").startsWith("audio");
  } catch {
    return false;
  }
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "00:00";
  const total = Math.floor(seconds);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function thumbnail(song: Song): string | undefined {
  return song.videoId ? `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg` : undefined;
}
