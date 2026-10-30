import { useCallback, useEffect, useRef, useState } from "react";
import { loadLyrics, type LyricLine } from "@/lib/lyrics";
import { hasBackup, isMedia, normalizeCode, type Song } from "@/lib/playlist";
import { loadYouTubeApi } from "@/lib/youtube";

export type Source = "youtube" | "mp3" | "video";

const INDEX_KEY = "supernova-26-finals-index";
const VOLUMES_KEY = "supernova-26-finals-volumes";
const DEFAULT_VOLUME = 80;
const RESTART_WINDOW = 5;
const YT_STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 } as const;
const NO_LYRICS: LyricLine[] = [];

const YT_ERRORS: Record<number, string> = {
  2: "视频链接无效 · Invalid video link",
  5: "浏览器无法播放该视频 · Playback error",
  100: "视频不存在或已被删除 · Video not found",
  101: "该视频不允许嵌入播放 · Embedding disabled",
  150: "该视频不允许嵌入播放 · Embedding disabled",
};

type CaptionControls = {
  unloadModule?: (name: string) => void;
  setOption?: (module: string, option: string, value: unknown) => void;
};

function hideCaptions(player: YT.Player) {
  // Not in the typed API, but the embed honours these; cc_load_policy alone doesn't stop auto-captions.
  const controls = player as YT.Player & CaptionControls;
  controls.setOption?.("captions", "track", {});
  controls.unloadModule?.("captions");
  controls.unloadModule?.("cc");
}

function savedIndex(): number {
  const value = Number.parseInt(localStorage.getItem(INDEX_KEY) ?? "", 10);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function volumeKey(song: Song): string {
  return song.videoId ?? `${song.singer}·${song.title}`;
}

function savedVolumes(): Record<string, number> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(VOLUMES_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function savedVolume(song: Song): number {
  const value = savedVolumes()[volumeKey(song)];
  return typeof value === "number" && value >= 0 && value <= 100 ? value : DEFAULT_VOLUME;
}

function saveVolume(song: Song, value: number | null) {
  const volumes = savedVolumes();
  if (value === null) delete volumes[volumeKey(song)];
  else volumes[volumeKey(song)] = value;
  localStorage.setItem(VOLUMES_KEY, JSON.stringify(volumes));
}

export function usePlayer(songs: Song[]) {
  const [index, setIndex] = useState(0);
  const [source, setSource] = useState<Source>("youtube");
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [time, setTime] = useState({ current: 0, duration: 0 });
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const [ytReady, setYtReady] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);
  const [backups, setBackups] = useState<Record<number, boolean>>({});
  const [lyrics, setLyrics] = useState<Record<number, LyricLine[]>>({});
  const [showLyrics, setShowLyrics] = useState(true);
  const [audio] = useState(() => {
    const element = new Audio();
    element.preload = "auto";
    return element;
  });

  const ytHost = useRef<HTMLDivElement>(null);
  const yt = useRef<YT.Player | null>(null);
  const videoHost = useRef<HTMLVideoElement>(null);
  const state = useRef({
    index: 0,
    source: "youtube" as Source,
    playing: false,
    started: false,
    ytReady: false,
    volume: DEFAULT_VOLUME,
    autoMp3: false,
  });
  const hasSongs = songs.length > 0;

  const update = useCallback(
    (patch: Partial<{ playing: boolean; started: boolean; ended: boolean }>) => {
      if (patch.playing !== undefined) {
        state.current.playing = patch.playing;
        setPlaying(patch.playing);
      }
      if (patch.started !== undefined) {
        state.current.started = patch.started;
        setStarted(patch.started);
      }
      if (patch.ended !== undefined) setEnded(patch.ended);
    },
    [],
  );

  const cueYouTube = useCallback((song: Song) => {
    const player = yt.current;
    if (!player || !state.current.ytReady) return;
    if (song.videoId) player.cueVideoById({ videoId: song.videoId, startSeconds: song.start });
    else player.stopVideo();
  }, []);

  const applyVolume = useCallback(
    (value: number) => {
      state.current.volume = value;
      setVolumeState(value);
      audio.volume = value / 100;
      if (yt.current && state.current.ytReady) {
        yt.current.setVolume(value);
        if (value > 0) yt.current.unMute();
      }
      if (videoHost.current) videoHost.current.volume = value / 100;
    },
    [audio],
  );

  const prepare = useCallback(
    (target: number) => {
      const song = songs[target];
      if (!song) return;
      state.current.index = target;
      setIndex(target);
      localStorage.setItem(INDEX_KEY, String(target));
      update({ playing: false, started: false, ended: false });
      const nextSource = state.current.autoMp3 ? "youtube" : song.videoUrl ? "video" : "youtube";
      state.current.autoMp3 = false;
      state.current.source = nextSource;
      setSource(nextSource);
      setYtError(song.videoUrl || song.videoId || !isMedia(song) ? null : "该曲目没有 YouTube 链接 · No YouTube link");
      setTime({ current: song.start, duration: 0 });
      applyVolume(savedVolume(song));

      audio.pause();
      if (isMedia(song)) audio.src = song.start > 0 ? `${song.backupUrl}#t=${song.start}` : song.backupUrl;
      else audio.removeAttribute("src");
      const video = videoHost.current;
      video?.pause();
      if (video) {
        if (song.videoUrl) {
          video.src = song.videoUrl;
          video.load();
        } else {
          video.removeAttribute("src");
          video.load();
        }
      }
      cueYouTube(song);
    },
    [applyVolume, audio, cueYouTube, songs, update],
  );

  useEffect(() => {
    if (hasSongs) prepare(Math.min(savedIndex(), songs.length - 1));
    // Only the first load of the playlist picks the starting song.
  }, [hasSongs]);

  useEffect(() => {
    if (!hasSongs) return;
    let cancelled = false;
    loadYouTubeApi()
      .then((api) => {
        if (cancelled || !ytHost.current) return;
        const mount = document.createElement("div");
        ytHost.current.replaceChildren(mount);
        yt.current = new api.Player(mount, {
          width: "100%",
          height: "100%",
          playerVars: {
            controls: 0,
            cc_load_policy: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              event.target.setVolume(state.current.volume);
              state.current.ytReady = true;
              setYtReady(true);
            },
            onApiChange: (event) => hideCaptions(event.target),
            onStateChange: (event) => {
              if (event.data === YT_STATE.PLAYING || event.data === YT_STATE.BUFFERING) hideCaptions(event.target);
              if (state.current.source !== "youtube") return;
              if (event.data === YT_STATE.PLAYING) update({ playing: true, started: true, ended: false });
              else if (event.data === YT_STATE.PAUSED || event.data === YT_STATE.CUED) update({ playing: false });
              else if (event.data === YT_STATE.ENDED) update({ playing: false, ended: true });
            },
            onError: (event) => {
              if (state.current.source === "youtube") {
                setYtError(YT_ERRORS[event.data] ?? `YouTube error ${event.data}`);
              }
            },
          },
        });
      })
      .catch((error: Error) => setYtError(error.message));

    return () => {
      cancelled = true;
      yt.current?.destroy();
      yt.current = null;
      state.current.ytReady = false;
      setYtReady(false);
    };
  }, [hasSongs, update]);

  useEffect(() => {
    const song = songs[state.current.index];
    if (ytReady && song) cueYouTube(song);
  }, [ytReady, cueYouTube, songs]);

  useEffect(() => {
    const isActive = () => state.current.source === "mp3";
    const onPlay = () => isActive() && update({ playing: true, started: true, ended: false });
    const onPause = () => isActive() && update({ playing: false });
    const onEnded = () => isActive() && update({ playing: false, ended: true });
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
    };
  }, [audio, update]);

  useEffect(() => {
    const video = videoHost.current;
    if (!video) return;
    const isActive = () => state.current.source === "video";
    const onPlay = () => isActive() && update({ playing: true, started: true, ended: false });
    const onPause = () => isActive() && update({ playing: false });
    const onEnded = () => isActive() && update({ playing: false, ended: true });
    const onLoadedMetadata = () => {
      const current = songs[state.current.index];
      if (isActive() && current?.videoUrl && current.start > 0) {
        video.currentTime = Math.min(current.start, video.duration || current.start);
      }
    };
    const onError = () => {
      if (isActive()) setYtError("无法播放本地视频 · Could not play local video");
    };
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("error", onError);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("error", onError);
      video.pause();
    };
  }, [songs, update]);

  const song = songs[index];

  useEffect(() => {
    if (!song || !isMedia(song) || backups[song.index] !== undefined) return;
    let cancelled = false;
    void hasBackup(song).then((available) => {
      if (!cancelled) setBackups((current) => ({ ...current, [song.index]: available }));
    });
    return () => {
      cancelled = true;
    };
  }, [song, backups]);

  useEffect(() => {
    if (!song || !isMedia(song) || lyrics[song.index] !== undefined) return;
    let cancelled = false;
    void loadLyrics(song).then((lines) => {
      if (!cancelled) setLyrics((current) => ({ ...current, [song.index]: lines }));
    });
    return () => {
      cancelled = true;
    };
  }, [song, lyrics]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = songs[state.current.index];
      if (!current) return;
      if (state.current.source === "mp3") {
        setTime({ current: audio.currentTime || 0, duration: Number.isFinite(audio.duration) ? audio.duration : 0 });
        return;
      }
      if (state.current.source === "video") {
        const video = videoHost.current;
        if (video) {
          setTime({
            current: video.currentTime || 0,
            duration: Number.isFinite(video.duration) ? video.duration : 0,
          });
        }
        return;
      }
      const player = yt.current;
      if (!player || !state.current.ytReady || typeof player.getCurrentTime !== "function") return;
      const position = player.getCurrentTime() || 0;
      setTime({
        current: state.current.started ? position : Math.max(position, current.start),
        duration: player.getDuration() || 0,
      });
    }, 250);
    return () => window.clearInterval(timer);
  }, [audio, songs]);

  const position = useCallback(() => {
    if (state.current.source === "mp3") return audio.currentTime || 0;
    if (state.current.source === "video") return videoHost.current?.currentTime || 0;
    const player = yt.current;
    return player && state.current.ytReady ? player.getCurrentTime() || 0 : 0;
  }, [audio]);

  const toggle = useCallback(() => {
    const current = songs[state.current.index];
    if (!current || !isMedia(current)) return;
    if (state.current.source === "mp3") {
      if (!audio.paused) return audio.pause();
      if (audio.ended) audio.currentTime = current.start;
      void audio.play().catch(() => update({ playing: false }));
      return;
    }
    if (state.current.source === "video") {
      const video = videoHost.current;
      if (!video) return;
      if (!video.paused) return video.pause();
      if (video.ended) video.currentTime = current.start;
      void video.play().catch(() => {
        setYtError("无法播放本地视频 · Could not play local video");
        update({ playing: false });
      });
      return;
    }
    const player = yt.current;
    if (!player || !state.current.ytReady || !current.videoId) return;
    const ytState = player.getPlayerState();
    if (ytState === YT_STATE.PLAYING || ytState === YT_STATE.BUFFERING) player.pauseVideo();
    else if (ytState === YT_STATE.ENDED) player.loadVideoById({ videoId: current.videoId, startSeconds: current.start });
    else player.playVideo();
  }, [audio, songs, update]);

  const back = useCallback(() => {
    const current = songs[state.current.index];
    if (!current) return;
    const intoSong = position() - current.start;
    const target = intoSong <= RESTART_WINDOW && state.current.index > 0 ? state.current.index - 1 : state.current.index;
    prepare(target);
  }, [position, prepare, songs]);

  const next = useCallback(() => {
    if (state.current.index < songs.length - 1) prepare(state.current.index + 1);
  }, [prepare, songs.length]);

  const jump = useCallback(
    (code: string) => {
      const target = songs.findIndex((item) => normalizeCode(item.code) === normalizeCode(code));
      if (target < 0) return false;
      prepare(target);
      return true;
    },
    [prepare, songs],
  );

  const setVolume = useCallback(
    (value: number) => {
      const current = songs[state.current.index];
      if (current) saveVolume(current, value);
      applyVolume(value);
    },
    [applyVolume, songs],
  );

  const resetVolume = useCallback(() => {
    const current = songs[state.current.index];
    if (current) saveVolume(current, null);
    applyVolume(DEFAULT_VOLUME);
  }, [applyVolume, songs]);

  const switchSource = useCallback((target: Source, onlyThisSong: boolean) => {
    const current = songs[state.current.index];
    if (!current || !isMedia(current) || current.videoUrl || state.current.source === target) return;
    const at = position();
    const resume = state.current.playing;
    state.current.source = target;
    state.current.autoMp3 = onlyThisSong;
    setSource(target);
    update({ playing: false });

    const player = state.current.ytReady ? yt.current : null;
    const midSong = at > current.start + 1;
    if (target === "mp3") {
      player?.pauseVideo();
      if (midSong) audio.currentTime = at;
      if (resume) void audio.play().catch(() => update({ playing: false }));
    } else {
      audio.pause();
      if (!player || !current.videoId) return;
      if (midSong) {
        player.seekTo(at, true);
        if (resume) player.playVideo();
        else player.pauseVideo();
      } else if (resume) player.playVideo();
    }
  }, [audio, position, songs, update]);

  const toggleBackup = useCallback(
    () => switchSource(state.current.source === "youtube" ? "mp3" : "youtube", false),
    [switchSource],
  );

  const backupThisSongOnly = useCallback(() => switchSource("mp3", true), [switchSource]);

  return {
    ytHost,
    videoHost,
    song,
    index,
    source,
    playing,
    started,
    ended,
    time,
    volume,
    ytReady,
    ytError,
    media: song ? isMedia(song) : false,
    total: songs.length,
    backupAvailable: song ? backups[song.index] : undefined,
    lyrics: (song && lyrics[song.index]) || NO_LYRICS,
    showLyrics,
    toggleLyrics: () => setShowLyrics((shown) => !shown),
    position,
    canBack: Boolean(song),
    canNext: index < songs.length - 1,
    toggle,
    back,
    next,
    jump,
    setVolume,
    resetVolume,
    volumeIsDefault: volume === DEFAULT_VOLUME,
    toggleBackup,
    backupThisSongOnly,
  };
}

export type Player = ReturnType<typeof usePlayer>;
