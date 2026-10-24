export type Song = {
  order: number;
  singer: string;
  title: string;
  link: string;
  videoId: string | null;
  start: number;
  backupUrl: string;
};

const BASE = import.meta.env.BASE_URL;

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

  return rows.flatMap((line) => {
    const [rawOrder, rawSinger, rawTitle, rawLink] = line.split(",").map((part) => part.trim());
    const order = Number.parseInt(rawOrder ?? "", 10);
    if (!Number.isFinite(order) || !rawSinger || !rawTitle) return [];
    const link = rawLink ?? "";
    const { videoId, start } = parseYouTube(link);
    const fileName = `${String(order).padStart(2, "0")}_${rawSinger}_${rawTitle}.mp3`;
    return [
      {
        order,
        singer: rawSinger,
        title: rawTitle,
        link,
        videoId,
        start,
        backupUrl: `${BASE}backup-audio/${encodeURIComponent(fileName)}`,
      },
    ];
  });
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
