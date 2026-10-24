import { useCallback, useEffect, useRef, useState } from "react";
import { hasBackup, type Song } from "@/lib/playlist";
import { loadYouTubeApi } from "@/lib/youtube";

export type Source = "youtube" | "mp3";

const INDEX_KEY = "supernova-26-semifinals-index";
const RESTART_WINDOW = 5;
const YT_STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 } as const;

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

export function usePlayer(songs: Song[]) {
  const [index, setIndex] = useState(0);
  const [source, setSource] = useState<Source>("youtube");
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [time, setTime] = useState({ current: 0, duration: 0 });
  const [volume, setVolumeState] = useState(80);
  const [ytReady, setYtReady] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);
  const [backups, setBackups] = useState<Record<number, boolean>>({});
  const [audio] = useState(() => {
    const element = new Audio();
    element.preload = "auto";
    return element;
  });

  const ytHost = useRef<HTMLDivElement>(null);
  const yt = useRef<YT.Player | null>(null);
  const state = useRef({
    index: 0,
    source: "youtube" as Source,
    playing: false,
    started: false,
    ytReady: false,
    volume: 80,
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

  const prepare = useCallback(
    (target: number) => {
      const song = songs[target];
      if (!song) return;
      state.current.index = target;
      setIndex(target);
      localStorage.setItem(INDEX_KEY, String(target));
      update({ playing: false, started: false, ended: false });
      if (state.current.autoMp3) {
        state.current.autoMp3 = false;
        state.current.source = "youtube";
        setSource("youtube");
      }
      setYtError(song.videoId ? null : "该曲目没有 YouTube 链接 · No YouTube link");
      setTime({ current: song.start, duration: 0 });

      audio.pause();
      audio.src = song.start > 0 ? `${song.backupUrl}#t=${song.start}` : song.backupUrl;
      cueYouTube(song);
    },
    [audio, cueYouTube, songs, update],
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
            onError: (event) => setYtError(YT_ERRORS[event.data] ?? `YouTube error ${event.data}`),
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

  const song = songs[index];

  useEffect(() => {
    if (!song || backups[song.order] !== undefined) return;
    let cancelled = false;
    void hasBackup(song).then((available) => {
      if (!cancelled) setBackups((current) => ({ ...current, [song.order]: available }));
    });
    return () => {
      cancelled = true;
    };
  }, [song, backups]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = songs[state.current.index];
      if (!current) return;
      if (state.current.source === "mp3") {
        setTime({ current: audio.currentTime || 0, duration: Number.isFinite(audio.duration) ? audio.duration : 0 });
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
    const player = yt.current;
    return player && state.current.ytReady ? player.getCurrentTime() || 0 : 0;
  }, [audio]);

  const toggle = useCallback(() => {
    const current = songs[state.current.index];
    if (!current) return;
    if (state.current.source === "mp3") {
      if (!audio.paused) return audio.pause();
      if (audio.ended) audio.currentTime = current.start;
      void audio.play().catch(() => update({ playing: false }));
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
    (order: number) => {
      const target = songs.findIndex((item) => item.order === order);
      if (target < 0) return false;
      prepare(target);
      return true;
    },
    [prepare, songs],
  );

  const setVolume = useCallback(
    (value: number) => {
      state.current.volume = value;
      setVolumeState(value);
      audio.volume = value / 100;
      if (yt.current && state.current.ytReady) {
        yt.current.setVolume(value);
        if (value > 0) yt.current.unMute();
      }
    },
    [audio],
  );

  const switchSource = useCallback((target: Source, onlyThisSong: boolean) => {
    const current = songs[state.current.index];
    if (!current || state.current.source === target) return;
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
    backupAvailable: song ? backups[song.order] : undefined,
    canBack: Boolean(song),
    canNext: index < songs.length - 1,
    toggle,
    back,
    next,
    jump,
    setVolume,
    toggleBackup,
    backupThisSongOnly,
  };
}

export type Player = ReturnType<typeof usePlayer>;
